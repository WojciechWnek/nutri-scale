import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Recipe } from '../recipes/entities/recipe.entity';
import { PDFParse } from 'pdf-parse';
import Groq from 'groq-sdk';

@Injectable()
export class PdfExtractorService {
  private readonly logger = new Logger(PdfExtractorService.name);
  private groq: Groq;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.error('GROQ_API_KEY is not set in environment variables.');
      throw new Error('GROQ_API_KEY is not configured.');
    }
    this.groq = new Groq({ apiKey });
    this.modelName = this.configService.get<string>(
      'GROQ_MODEL',
      'llama-3.3-70b-versatile',
    );
  }

  /**
   * Extracts text content from a PDF file buffer.
   * @param pdfBuffer The buffer containing the PDF file data.
   * @returns A promise that resolves to the extracted text.
   */
  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    this.logger.log('Extracting text from PDF buffer...');
    try {
      const parser = new PDFParse(new Uint8Array(pdfBuffer));
      const data = await parser.getText();
      this.logger.log('Text extraction from PDF successful.');
      return data.text;
    } catch (error) {
      this.logger.error('Failed to extract text from PDF.', error);
      throw new Error('Could not parse the PDF file.');
    }
  }

  async extractRecipeData(text: string): Promise<Partial<Recipe>> {
    this.logger.log('Sending text to Groq API for processing...');
    const prompt = `Given the following recipe text, extract the recipe details into a JSON object matching the TypeScript interface below. If a field is not found, omit it. For ingredients, try to separate name, quantity, and unit. For instructions, provide an array of strings for each step.

TypeScript Interface for Recipe:
interface Recipe {
  name: string;
  description?: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
}

Recipe Text:
${text}

IMPORTANT: Return ONLY the raw JSON object. Do not wrap it in markdown code blocks or add any other text.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that extracts structured data from recipes. You output only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.modelName,
        temperature: 0,
        response_format: { type: 'json_object' },
      });

      const jsonText = completion.choices[0]?.message?.content?.trim();

      if (!jsonText) {
        throw new Error('Empty response from Groq API');
      }

      const parsedData = JSON.parse(jsonText) as Partial<Recipe>;
      this.logger.log('Groq API response parsed successfully.');
      return parsedData;
    } catch (error) {
      this.logger.error('Error calling Groq API or parsing response:', error);
      throw new Error('Failed to process recipe text with AI model.');
    }
  }
}
