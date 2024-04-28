import { RecipeDocumentInterface } from "../recipe.js";

export interface RecipesPerDay {
  recipeStarterID: RecipeDocumentInterface;
  recipeMainDishID: RecipeDocumentInterface;
  recipeDessertID: RecipeDocumentInterface;
  bread: boolean
}