import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNutritionDto: CreateNutritionDto) {
    // Check if ingredient exists
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: createNutritionDto.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${createNutritionDto.ingredientId} not found`,
      );
    }

    // Check if nutrition already exists for this ingredient
    const existingNutrition = await this.prisma.nutrition.findUnique({
      where: { ingredientId: createNutritionDto.ingredientId },
    });

    if (existingNutrition) {
      throw new ConflictException(
        `Nutrition data already exists for ingredient ${createNutritionDto.ingredientId}. Use PATCH to update.`,
      );
    }

    return this.prisma.nutrition.create({
      data: {
        ingredientId: createNutritionDto.ingredientId,
        caloriesPer100: createNutritionDto.caloriesPer100,
        caloriesUnit: createNutritionDto.caloriesUnit || 'kcal',
        protein: createNutritionDto.protein,
        carbs: createNutritionDto.carbs,
        fat: createNutritionDto.fat,
        fiber: createNutritionDto.fiber,
      },
      include: {
        ingredient: true,
      },
    });
  }

  async findAll() {
    return this.prisma.nutrition.findMany({
      include: {
        ingredient: true,
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const nutrition = await this.prisma.nutrition.findUnique({
      where: { id },
      include: {
        ingredient: true,
      },
    });

    if (!nutrition) {
      throw new NotFoundException(`Nutrition entry with ID ${id} not found`);
    }

    return nutrition;
  }

  async findByIngredientId(ingredientId: string) {
    const nutrition = await this.prisma.nutrition.findUnique({
      where: { ingredientId },
      include: {
        ingredient: true,
      },
    });

    if (!nutrition) {
      throw new NotFoundException(
        `Nutrition data not found for ingredient ${ingredientId}`,
      );
    }

    return nutrition;
  }

  async update(id: string, updateNutritionDto: UpdateNutritionDto) {
    try {
      return await this.prisma.nutrition.update({
        where: { id },
        data: updateNutritionDto,
        include: {
          ingredient: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Nutrition entry with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateByIngredientId(
    ingredientId: string,
    updateNutritionDto: UpdateNutritionDto,
  ) {
    const nutrition = await this.prisma.nutrition.findUnique({
      where: { ingredientId },
    });

    if (!nutrition) {
      throw new NotFoundException(
        `Nutrition data not found for ingredient ${ingredientId}`,
      );
    }

    return this.prisma.nutrition.update({
      where: { ingredientId },
      data: updateNutritionDto,
      include: {
        ingredient: true,
      },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.nutrition.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Nutrition entry with ID ${id} not found`);
      }
      throw error;
    }
  }

  async removeByIngredientId(ingredientId: string) {
    try {
      await this.prisma.nutrition.delete({
        where: { ingredientId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Nutrition data not found for ingredient ${ingredientId}`,
        );
      }
      throw error;
    }
  }
}
