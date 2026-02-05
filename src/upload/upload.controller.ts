import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express'; // Import Request to get Express namespace typings
import * as path from 'path';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  @Post('pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req: Request, file: Express.Multer.File, callback) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return callback(new BadRequestException('Only PDF files are allowed!'), false);
        }
        callback(null, true);
      },
      // You can add limits here, e.g., fileSize: 1024 * 1024 * 5 // 5MB
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No PDF file provided!');
    }

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

    return {
      message: 'PDF file uploaded successfully!',
      filename: filename,
      filePath: filePath,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}