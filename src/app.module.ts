import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecipesModule } from './recipes/recipes.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { NutritionModule } from './nutrition/nutrition.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RecipesModule,
    UploadModule,
    UsersModule,
    AuthModule,
    PrismaModule,
    IngredientsModule,
    NutritionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
