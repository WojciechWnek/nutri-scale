import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { PdfExtractorService } from '../pdf-extractor/pdf-extractor.service'; // Import PdfExtractorService
import { SseService } from '../sse/sse.service'; // Import SseService

@Module({
  controllers: [UploadController],
  providers: [PdfExtractorService, SseService] // Add SseService here
})
export class UploadModule {}
