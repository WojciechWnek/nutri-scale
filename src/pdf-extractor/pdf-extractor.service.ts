import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Recipe } from '../recipes/entities/recipe.entity';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfExtractorService {
  private readonly logger = new Logger(PdfExtractorService.name);
  private geminiModel: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
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
    this.logger.log('Sending text to Gemini API for processing...');
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

JSON Output:
`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = result.response;
      const jsonText = response.text().trim();

      // Attempt to clean up common issues with AI-generated JSON (e.g., markdown code blocks)
      const cleanedJsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();

      const parsedData: Partial<Recipe> = JSON.parse(cleanedJsonText);
      this.logger.log('Gemini API response parsed successfully.');
      return parsedData;
    } catch (error) {
      this.logger.error('Error calling Gemini API or parsing response:', error);
      // Attempt to return partial data even on error if possible, or throw
      throw new Error('Failed to process recipe text with AI model.');
    }
  }
}
