import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Nutri-Scale API')
    .setDescription('API documentation for the Nutri-Scale application')
    .setVersion('1.0')
    .addTag('recipes') // You can add more tags as you develop more modules
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 'api' is the path to access Swagger UI

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
