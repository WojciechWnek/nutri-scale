import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SseService } from '../sse/sse.service';
import { PdfExtractorService } from '../pdf-extractor/pdf-extractor.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = './uploads';

  constructor(
    private readonly sseService: SseService,
    private readonly pdfExtractorService: PdfExtractorService,
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

  // This method runs in the background. It does not block the initial HTTP request.
  async processPdfJob(file: Express.Multer.File, jobId: string): Promise<void> {
    this.logger.log(`Starting PDF processing for job: ${jobId}`);

    // Emit initial status
    this.sseService.sendEvent(jobId, 'parsingStatus', {
      status: 'started',
      filename: file.originalname,
    });

    try {
      // Step 1: Extract Text
      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'extracting_text',
      });
      const extractedText = await this.pdfExtractorService.extractTextFromPdf(
        file.buffer,
      );

      // Step 2: Process with AI
      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'processing_ai',
      });
      const parsedRecipe =
        await this.pdfExtractorService.extractRecipeData(extractedText);

      // Step 3: Job Finished
      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'finished',
        parsedRecipe: parsedRecipe,
      });

      this.logger.log(`Successfully finished PDF processing for job: ${jobId}`);
    } catch (error) {
      this.logger.error(`Job ${jobId} failed:`, error);
      this.sseService.sendEvent(jobId, 'parsingStatus', {
        status: 'failed',
        error: error.message,
      });
    } finally {
      // Step 4: Always complete the stream
      this.logger.log(`Completing SSE stream for job: ${jobId}`);
      this.sseService.completeStream(jobId);
    }
  }
}
