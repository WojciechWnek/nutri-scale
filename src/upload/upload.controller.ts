import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Sse,
  MessageEvent,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express'; // Import Request to get Express namespace typings
import * as path from 'path';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { ApiConsumes, ApiBody } from '@nestjs/swagger'; // Import Swagger decorators
import { PdfExtractorService } from '../pdf-extractor/pdf-extractor.service'; // Import PdfExtractorService
import { Recipe } from '../recipes/entities/recipe.entity'; // Import Recipe entity
import { SseService } from '../sse/sse.service'; // Import SseService
import { Observable } from 'rxjs'; // Import Observable
import { map } from 'rxjs/operators'; // Import map operator
import { v4 as uuidv4 } from 'uuid'; // Import uuid for jobId generation

@Controller('upload')
export class UploadController {
  constructor(
    private readonly pdfExtractorService: PdfExtractorService,
    private readonly sseService: SseService, // Inject SseService
  ) {}

  @Post('pdf')
  @ApiConsumes('multipart/form-data') // Declare that this endpoint consumes form-data
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // This tells Swagger to render a file upload input
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req: Request, file: Express.Multer.File, callback) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return callback(
            new BadRequestException('Only PDF files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      // You can add limits here, e.g., fileSize: 1024 * 1024 * 5 // 5MB
    }),
  )
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    if (!file) {
      throw new BadRequestException('No PDF file provided!');
    }

    const jobId = uuidv4(); // Generate a unique job ID
    this.sseService.createSseStream(jobId); // Create an SSE stream for this job

    // Emit initial status
    this.sseService.sendEvent(jobId, 'parsingStatus', {
      status: 'started',
      filename: file.originalname,
      jobId: jobId,
    });

    // Asynchronous processing (non-blocking)
    (async () => {
      // Define a temporary upload directory
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      // Generate a unique filename
      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, filename);

      // Save the file to the temporary directory
      fs.writeFileSync(filePath, file.buffer);

      let extractedText = '';
      let parsedRecipe: Partial<Recipe> = {};

      try {
        this.sseService.sendEvent(jobId, 'parsingStatus', {
          status: 'extracting_text',
          filename: file.originalname,
          jobId: jobId,
        });
        const parser = new PDFParse(new Uint8Array(file.buffer));
        const result = await parser.getText();
        extractedText = result.text;

        this.sseService.sendEvent(jobId, 'parsingStatus', {
          status: 'processing_ai',
          filename: file.originalname,
          jobId: jobId,
        });
        parsedRecipe =
          await this.pdfExtractorService.extractRecipeData(extractedText);

        this.sseService.sendEvent(jobId, 'parsingStatus', {
          status: 'finished',
          filename: file.originalname,
          parsedRecipe: parsedRecipe,
          jobId: jobId,
        });
      } catch (error) {
        console.error('Error parsing PDF:', error);
        this.sseService.sendEvent(jobId, 'parsingStatus', {
          status: 'failed',
          filename: file.originalname,
          error: error.message,
          jobId: jobId,
        });
      } finally {
        this.sseService.completeStream(jobId); // Complete the stream after job is done or failed
      }
    })(); // Execute the async IIFE

    return { jobId: jobId }; // Return jobId immediately
  }

  @Sse('status/:jobId')
  sseEvents(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return this.sseService.createSseStream(jobId).pipe(
      // Map the SseEvent to NestJS MessageEvent format
      map((event) => ({ data: event.data, type: event.type })),
    );
  }
}
