import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNutrition(ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { nutrition: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${ingredientId} not found`,
      );
    }

    if (!ingredient.nutrition) {
      throw new NotFoundException(
        `No nutrition data found for ingredient ${ingredientId}`,
      );
    }

    return ingredient.nutrition;
  }

  async addNutrition(ingredientId: string, nutritionData: any) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { nutrition: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${ingredientId} not found`,
      );
    }

    if (ingredient.nutrition) {
      throw new ConflictException(
        `Nutrition data already exists for ingredient ${ingredientId}. Use PATCH to update.`,
      );
    }

    return this.prisma.nutrition.create({
      data: {
        ingredientId,
        caloriesPer100: nutritionData.caloriesPer100,
        caloriesUnit: nutritionData.caloriesUnit || 'kcal',
        protein: nutritionData.protein,
        carbs: nutritionData.carbs,
        fat: nutritionData.fat,
        fiber: nutritionData.fiber,
      },
    });
  }

  async updateNutrition(ingredientId: string, nutritionData: any) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { nutrition: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${ingredientId} not found`,
      );
    }

    if (!ingredient.nutrition) {
      throw new NotFoundException(
        `No nutrition data found for ingredient ${ingredientId}. Use POST to create.`,
      );
    }

    return this.prisma.nutrition.update({
      where: { ingredientId },
      data: nutritionData,
    });
  }

  async removeNutrition(ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { nutrition: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${ingredientId} not found`,
      );
    }

    if (!ingredient.nutrition) {
      throw new NotFoundException(
        `No nutrition data found for ingredient ${ingredientId}`,
      );
    }

    await this.prisma.nutrition.delete({
      where: { ingredientId },
    });
  }

  async create(createIngredientDto: CreateIngredientDto) {
    try {
      return await this.prisma.ingredient.create({
        data: {
          name: createIngredientDto.name,
        },
        include: {
          nutrition: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ingredient with name "${createIngredientDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.ingredient.findMany({
      include: {
        nutrition: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        nutrition: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    return ingredient;
  }

  async findByName(name: string) {
    return this.prisma.ingredient.findUnique({
      where: { name },
      include: {
        nutrition: true,
      },
    });
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto) {
    try {
      const ingredient = await this.prisma.ingredient.update({
        where: { id },
        data: updateIngredientDto,
        include: {
          nutrition: true,
        },
      });
      return ingredient;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Ingredient with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`Ingredient with this name already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if ingredient is used in any recipes
      const recipeIngredients = await this.prisma.recipeIngredient.findMany({
        where: { productId: id },
      });

      if (recipeIngredients.length > 0) {
        throw new ConflictException(
          `Cannot delete ingredient with ID ${id} because it is used in ${recipeIngredients.length} recipe(s)`,
        );
      }

      await this.prisma.ingredient.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Ingredient with ID ${id} not found`);
      }
      throw error;
    }
  }
}
