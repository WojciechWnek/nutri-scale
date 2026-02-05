import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;
}

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];

  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  prepTime?: number; // in minutes

  @IsOptional()
  @IsNumber()
  @Min(0)
  cookTime?: number; // in minutes

  @IsOptional()
  @IsNumber()
  @Min(1)
  servings?: number;
}