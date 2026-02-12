import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SseService } from '../sse/sse.service';
import { PdfExtractorService } from '../pdf-extractor/pdf-extractor.service';
import { RecipesService } from '../recipes/recipes.service';
import { JobStatus } from 'src/generated/prisma/enums';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = './uploads';

  constructor(
    private readonly sseService: SseService,
    private readonly pdfExtractorService: PdfExtractorService,
    private readonly recipesService: RecipesService,
  ) {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      this.logger.log(
        `Upload directory not found. Creating: ${this.uploadDir}`,
      );
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Cleaned up file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }

  async processPdfJob(
    file: Express.Multer.File,
    recipeId: string,
  ): Promise<void> {
    const jobId = recipeId; // Use recipeId as the jobId for SSE events
    this.logger.log(`Starting PDF processing for recipeId: ${jobId}`);

    this.sseService.sendEvent(jobId, 'parsingStatus', {
      status: 'started',
      filename: file.originalname,
    });

    const filename = `${Date.now()}-${file.originalname}`;
    let filePath: string | null = null;

    try {
      filePath = path.join(this.uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);
      this.logger.log(`File saved to ${filePath}`);

      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'extracting_text',
      });
      const extractedText = await this.pdfExtractorService.extractTextFromPdf(
        file.buffer,
      );

      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'processing_ai',
      });
      const parsedRecipe =
        await this.pdfExtractorService.extractRecipeData(extractedText);

      await this.recipesService.update(jobId, {
        ...parsedRecipe,
        status: JobStatus.COMPLETED,
      });

      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'finished',
        parsedRecipe: parsedRecipe,
      });

      this.logger.log(`Successfully finished PDF processing for job: ${jobId}`);
    } catch (error) {
      this.logger.error(`Job ${jobId} failed:`, error);
      await this.recipesService.update(jobId, {
        status: JobStatus.FAILED,
        error: error.message,
      });
      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'failed',
        error: error.message,
      });
    } finally {
      if (filePath) {
        await this.cleanupFile(filePath);
      }
      this.logger.log(`Completing SSE stream for job: ${jobId}`);
      this.sseService.completeStream(jobId);
    }
  }
}
