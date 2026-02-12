export interface CreateNutritionDto {
  ingredientId: string;
  caloriesPer100: number;
  caloriesUnit?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}
