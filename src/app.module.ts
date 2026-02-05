import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { RecipesModule } from './recipes/recipes.module';
import { UploadModule } from './upload/upload.module';
import { SseService } from './sse/sse.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'nutri-scale.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // This should be false in production
    }),
    RecipesModule,
    UploadModule,
  ],
  controllers: [],
  providers: [SseService],
})
export class AppModule {}
