import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecipesModule } from './recipes/recipes.module';
import { UploadModule } from './upload/upload.module';
import { SseService } from './sse/sse.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'nutri-scale.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Scan for entities
      synchronize: true, // This should be false in production
    }),
    RecipesModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, SseService], // PdfExtractorService removed
})
export class AppModule {}
