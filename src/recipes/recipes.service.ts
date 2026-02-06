import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { Recipe, JobStatus } from './entities/recipe.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  /**
   * Creates a new recipe from a DTO (e.g., from a form submission).
   * The recipe is considered complete by default.
   * @param createRecipeDto The recipe data.
   * @returns The newly created recipe.
   */
  create(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipeRepository.create({
      ...createRecipeDto,
      status: JobStatus.COMPLETED, // Mark as completed since it's created directly
    });
    return this.recipeRepository.save(recipe);
  }

  /**
   * Creates an empty recipe with a 'processing' status.
   * This is the first step in the async creation process.
   * @returns The newly created recipe stub.
   */
  createEmpty(): Promise<Recipe> {
    const recipe = this.recipeRepository.create({
      status: JobStatus.PROCESSING,
    });
    return this.recipeRepository.save(recipe);
  }

  findAll(): Promise<Recipe[]> {
    // Optionally, you might want to filter out non-completed recipes
    return this.recipeRepository.find({
      where: { status: JobStatus.COMPLETED },
    });
  }

  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOneBy({ id });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    return recipe;
  }

  async update(id: string, updatePayload: Partial<Recipe>): Promise<Recipe> {
    const recipe = await this.recipeRepository.preload({
      id: id,
      ...updatePayload,
    });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    return this.recipeRepository.save(recipe);
  }

  async remove(id: string): Promise<void> {
    const result = await this.recipeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
  }
}