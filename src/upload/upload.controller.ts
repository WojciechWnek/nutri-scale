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
// import * as pdfParse from 'pdf-parse'; // Import pdf-parse
import { ApiConsumes, ApiBody } from '@nestjs/swagger'; // Import Swagger decorators

@Controller('upload')
export class UploadController {
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

    // let extractedText = '';
    // try {
    //   const data = await pdfParse(file.buffer);
    //   extractedText = data.text;
    // } catch (error) {
    //   console.error('Error parsing PDF:', error);
    //   throw new BadRequestException('Failed to parse PDF file.');
    // }

    return {
      message: 'PDF file uploaded successfully!',
      filename: filename,
      filePath: filePath,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      // extractedText: extractedText, // Return the extracted text
    };
  }
}
