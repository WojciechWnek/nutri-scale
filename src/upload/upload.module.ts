import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PdfExtractorModule } from '../pdf-extractor/pdf-extractor.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [PdfExtractorModule, SseModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
