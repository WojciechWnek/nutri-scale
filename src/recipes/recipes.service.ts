import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  ParsedRecipeData,
  ParsedRecipesBatchDto,
} from './dto/parsed-recipe.dto';
import { JobStatus } from 'src/generated/prisma/enums';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new recipe from a DTO (e.g., from a form submission).
   * The recipe is considered complete by default.
   * Also creates related ingredients and instructions if provided.
   * @param createRecipeDto The recipe data.
   * @returns The newly created recipe with relations.
   */
  async create(createRecipeDto: CreateRecipeDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipe.create({
        data: {
          name: createRecipeDto.name,
          description: createRecipeDto.description,
          prepTime: createRecipeDto.prepTime,
          cookTime: createRecipeDto.cookTime,
          servings: createRecipeDto.servings,
          status: JobStatus.COMPLETED,
        },
      });

      // Create ingredients if provided
      if (
        createRecipeDto.ingredients &&
        createRecipeDto.ingredients.length > 0
      ) {
        for (const ingredient of createRecipeDto.ingredients) {
          // Find or create the ingredient
          let product = await tx.ingredient.findUnique({
            where: { name: ingredient.name },
          });

          if (!product) {
            product = await tx.ingredient.create({
              data: {
                name: ingredient.name,
              },
            });
          }

          // Create the recipe ingredient link
          await tx.recipeIngredient.create({
            data: {
              recipeId: recipe.id,
              productId: product.id,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
            },
          });
        }
      }

      // Create instructions if provided
      if (
        createRecipeDto.instructions &&
        createRecipeDto.instructions.length > 0
      ) {
        for (const instruction of createRecipeDto.instructions) {
          await tx.instruction.create({
            data: {
              recipeId: recipe.id,
              step: instruction.step,
              content: instruction.content,
            },
          });
        }
      }

      // Return the created recipe with all relations
      const result = await tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          ingredients: {
            include: {
              product: true,
            },
          },
          instructions: {
            orderBy: {
              step: 'asc',
            },
          },
        },
      });

      if (!result) {
        throw new Error('Failed to create recipe');
      }

      return result;
    });
  }

  /**
   * Creates multiple recipes from parsed batch data.
   * Used when processing PDF with multiple recipes.
   * @param batchData The batch of parsed recipe data.
   * @returns Array of newly created recipes.
   */
  async createBatch(batchData: ParsedRecipesBatchDto) {
    const createdRecipes: Awaited<
      ReturnType<typeof this.createFromParsedData>
    >[] = [];

    for (const parsedData of batchData.recipes) {
      const recipe = await this.createFromParsedData(parsedData);
      createdRecipes.push(recipe);
    }

    return createdRecipes;
  }

  /**
   * Creates a single recipe from parsed data with all related entities.
   * @param parsedData The parsed recipe data.
   * @returns The newly created recipe with relations.
   */
  private async createFromParsedData(parsedData: ParsedRecipeData) {
    return this.prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipe.create({
        data: {
          name: parsedData.name,
          description: parsedData.description,
          prepTime: parsedData.prepTime,
          cookTime: parsedData.cookTime,
          servings: parsedData.servings,
          status: JobStatus.COMPLETED,
        },
      });

      // Create or find Ingredients and create RecipeIngredients
      for (const ingredient of parsedData.ingredients) {
        let product = await tx.ingredient.findUnique({
          where: { name: ingredient.name },
        });

        if (!product) {
          product = await tx.ingredient.create({
            data: {
              name: ingredient.name,
            },
          });
        }

        await tx.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            productId: product.id,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          },
        });
      }

      // Create instructions
      for (const instruction of parsedData.instructions) {
        await tx.instruction.create({
          data: {
            recipeId: recipe.id,
            step: instruction.step,
            content: instruction.content,
          },
        });
      }

      // Return the created recipe with all relations
      const result = await tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          ingredients: {
            include: {
              product: true,
            },
          },
          instructions: {
            orderBy: {
              step: 'asc',
            },
          },
        },
      });

      if (!result) {
        throw new Error('Failed to create recipe');
      }

      return result;
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
        name: 'Processing...',
        status: JobStatus.PROCESSING,
      },
    });
  }

  async findAll() {
    return this.prisma.recipe.findMany({
      where: { status: JobStatus.COMPLETED },
      include: {
        ingredients: {
          include: {
            product: true,
          },
        },
        instructions: {
          orderBy: {
            step: 'asc',
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            product: true,
          },
        },
        instructions: {
          orderBy: {
            step: 'asc',
          },
        },
      },
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

  /**
   * Updates a recipe with parsed data from PDF, creating related ingredients and instructions.
   * Uses a transaction to ensure all data is created consistently.
   */
  async updateFromParsedData(id: string, parsedData: ParsedRecipeData) {
    return this.prisma.$transaction(async (tx) => {
      // First, check if recipe exists
      const recipe = await tx.recipe.findUnique({
        where: { id },
      });

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }

      // Update the basic recipe data
      await tx.recipe.update({
        where: { id },
        data: {
          name: parsedData.name,
          description: parsedData.description,
          prepTime: parsedData.prepTime,
          cookTime: parsedData.cookTime,
          servings: parsedData.servings,
          status: JobStatus.COMPLETED,
        },
      });

      // Create or find Ingredients and create RecipeIngredients
      for (const ingredient of parsedData.ingredients) {
        // Find or create the ingredient
        let product = await tx.ingredient.findUnique({
          where: { name: ingredient.name },
        });

        if (!product) {
          product = await tx.ingredient.create({
            data: {
              name: ingredient.name,
            },
          });
        }

        // Create the recipe ingredient link
        await tx.recipeIngredient.create({
          data: {
            recipeId: id,
            productId: product.id,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          },
        });
      }

      // Create instructions
      for (const instruction of parsedData.instructions) {
        await tx.instruction.create({
          data: {
            recipeId: id,
            step: instruction.step,
            content: instruction.content,
          },
        });
      }

      // Return the updated recipe with all relations
      return tx.recipe.findUnique({
        where: { id },
        include: {
          ingredients: {
            include: {
              product: true,
            },
          },
          instructions: {
            orderBy: {
              step: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Updates a recipe with error status when processing fails.
   */
  async updateWithError(id: string, errorMessage: string) {
    try {
      return await this.prisma.recipe.update({
        where: { id },
        data: {
          status: JobStatus.FAILED,
          description: `Error: ${errorMessage}`,
        },
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
