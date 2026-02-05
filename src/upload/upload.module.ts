import { Module } from '@nestjs/common';

import { UploadController } from './upload.controller';
import { PdfExtractorService } from '../pdf-extractor/pdf-extractor.service';
import { SseService } from '../sse/sse.service';

@Module({
  controllers: [UploadController],
  providers: [PdfExtractorService, SseService],
})
export class UploadModule {}
