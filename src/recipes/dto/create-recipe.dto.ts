import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;
}

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @IsOptional()
  ingredients?: IngredientDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsNumber()
  @IsOptional()
  cookTime?: number;

  @IsNumber()
  @IsOptional()
  servings?: number;
}
