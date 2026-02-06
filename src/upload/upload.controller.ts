import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Sse,
  MessageEvent,
  Param,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SseService } from '../sse/sse.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly sseService: SseService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('pdf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return callback(
            new BadRequestException('Only PDF files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    if (!file) {
      throw new BadRequestException('No PDF file provided!');
    }

    const jobId = uuidv4();

    // Delegate the entire processing job to the service.
    // This method runs in the background and does not block the response.
    this.uploadService.processPdfJob(file, jobId);

    // Return the job ID to the client immediately.
    return { jobId };
  }

  @Sse('status/:jobId')
  sseEvents(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    // Handle client disconnects to prevent memory leaks.
    req.on('close', () => {
      this.sseService.handleDisconnect(jobId);
    });

    return this.sseService
      .createSseStream(jobId)
      .pipe(map((event) => ({ data: event.data, type: event.type })));
  }
}
