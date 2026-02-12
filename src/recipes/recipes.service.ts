import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { JobStatus } from 'src/generated/prisma/enums';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new recipe from a DTO (e.g., from a form submission).
   * The recipe is considered complete by default.
   * @param createRecipeDto The recipe data.
   * @returns The newly created recipe.
   */
  async create(createRecipeDto: CreateRecipeDto) {
    const ingredients = createRecipeDto.ingredients || [];
    const instructions = createRecipeDto.instructions || [];

    return this.prisma.recipe.create({
      data: {
        ...createRecipeDto,
        ingredients: ingredients as any,
        instructions: instructions as any,
        status: JobStatus.COMPLETED,
      },
    });
  }

  /**
   * Creates an empty recipe with a 'processing' status.
   * This is the first step in the async creation process.
   * @returns The newly created recipe stub.
   */
  async createEmpty() {
    return this.prisma.recipe.create({
      data: {
        status: JobStatus.PROCESSING,
      },
    });
  }

  async findAll() {
    return this.prisma.recipe.findMany({
      where: { status: JobStatus.COMPLETED },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return recipe;
  }

  async update(id: string, updatePayload: any) {
    try {
      return await this.prisma.recipe.update({
        where: { id },
        data: updatePayload,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.recipe.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }
      throw error;
    }
  }
}
