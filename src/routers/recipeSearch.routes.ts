import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Allergen } from "../models/enum/allergen.js";
import { FoodType } from "../models/enum/FoodType.js";

export const recipeSearch = express.Router();

recipeSearch.post('/recipeSearchPerIngredients', async (req, res) => {
  try {
    const ingredientsIDs: string[] = req.body.ingredients;

    // Recetas con todos los ingredientes
    const recipesWithAllIngredients = await Recipe.find({
      'ingredients.ingredientID': { $all: ingredientsIDs }
    }).limit(5);
    let recipes = recipesWithAllIngredients

    if (recipesWithAllIngredients.length < 5) {
      // Recetas ya buscadas
      const foundRecipeIds = recipesWithAllIngredients.map(recipe => recipe._id);

      const remainingRecipes = await Recipe.find({
        _id: { $nin: foundRecipeIds }, // No incluir recetas ya buscadas
        'ingredients.ingredientID': { $in: ingredientsIDs }
      }).limit(5 - recipesWithAllIngredients.length);


      recipes = recipesWithAllIngredients.concat(remainingRecipes);
      // Ordenar las recetas cantidad de ingredientes coincidentes
      recipes.sort((a, b) => {
        const ingredientsMatchA = a.ingredients.filter(ingredient => ingredientsIDs.includes(ingredient.ingredientID.toString())).length;
        const ingredientsMatchB = b.ingredients.filter(ingredient => ingredientsIDs.includes(ingredient.ingredientID.toString())).length;
        return ingredientsMatchB - ingredientsMatchA;
      });
    }

    // Enviar respuesta en formato JSON
    res.json({ recipes });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});


recipeSearch.post('/planner', async (req, res) => {
  const { excludeIngredients, excludeAllergens, days } = req.body;

  if (!days) {
    return res.status(400).send('Faltan parametros.');
  }

  try {
    const plan = await generateMealPlan(excludeIngredients, excludeAllergens, days);
    res.json(plan);
  } catch (error) {
    console.error('Error generando plan:', error);
    res.status(500).send('Internal Server Error');
  }
  return
});

const filterRecipes = async (excludeIngredients: string[], excludeAllergens: Allergen[]) => {
  return await Recipe.find({
    'ingredients.ingredientID': { $nin: excludeIngredients },
    allergens: { $nin: excludeAllergens }
  });
};

const generateMealPlan = async (excludeIngredients: string[], excludeAllergens: Allergen[], days: number) => {
  const filteredRecipes: RecipeDocumentInterface[] = await filterRecipes(excludeIngredients, excludeAllergens);

  const starters = filteredRecipes.filter(recipe => recipe.foodType === FoodType.Entrante);
  const mainCourses = filteredRecipes.filter(recipe => recipe.foodType === FoodType.PlatoPrincipal);
  const desserts = filteredRecipes.filter(recipe => recipe.foodType === FoodType.Postre);

  const getRandomRecipe = (recipes: RecipeDocumentInterface[], exclude: RecipeDocumentInterface[]) => {
    let availableRecipes = recipes.filter(recipe => !exclude.includes(recipe._id.toString()));
    if (availableRecipes.length === 0) {
      availableRecipes = recipes;
    }
    const randomIndex = Math.floor(Math.random() * availableRecipes.length);
    return availableRecipes[randomIndex];
  };

  const plan = [];
  const usedRecipes: { starter: RecipeDocumentInterface[], mainCourse: RecipeDocumentInterface[], dessert: RecipeDocumentInterface[] } = { starter: [], mainCourse: [], dessert: [] };

  for (let i = 0; i < days; i++) {
    const starter = getRandomRecipe(starters, usedRecipes.starter);
    const mainCourse = getRandomRecipe(mainCourses, usedRecipes.mainCourse);
    const dessert = getRandomRecipe(desserts, usedRecipes.dessert);

    usedRecipes.starter.push(starter._id.toString());
    usedRecipes.mainCourse.push(mainCourse._id.toString());
    usedRecipes.dessert.push(dessert._id.toString());

    plan.push({ day: i + 1, starter, mainCourse, dessert });
  }

  return plan;
};