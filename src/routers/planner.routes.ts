import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Allergen } from "../models/enum/allergen.js";
import { FoodType } from "../models/enum/FoodType.js";
import { RecipesPerDay } from "../models/enum/recipesPerDay.js";
import { Menu } from "../models/menu.js";

export const plannerRouter = express.Router();

plannerRouter.post('/planner', async (req, res) => {
  const {numberDays, numberServices, allergies, excludedIngredients } = req.body;

  if (!numberDays || !numberServices) {
    return res.status(400).send('Faltan parametros.');
  }

  try {
    const plan = await generateMealPlan(excludedIngredients, allergies,  numberDays);

    const today = new Date().toLocaleDateString('es-ES');

    const menu = await new Menu({
      title: today,
      numberDays: numberDays,
      numberServices: numberServices,
      recipesPerDay: plan,
      caloriesTarget: req.body.caloriesTarget,
      allergies: allergies,
      diet: req.body.diet,
      excludedIngredients: excludedIngredients,
    })
    
    await menu.populate({
      path: "recipesPerDay",
      populate: [
        {
          path: "recipeStarterID",
          select: "name",
        },
        {
          path: "recipeMainDishID",
          select: "name",
        },
        {
          path: "recipeDessertID",
          select: "name",
        }
      ]
    });
    return res.json(menu);
  } catch (error) {
    console.error('Error generando plan:', error);
    return res.status(500).send('Internal Server Error');
  }
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

  const plan: RecipesPerDay[] = [];
  const usedRecipes: { starter: RecipeDocumentInterface[], mainCourse: RecipeDocumentInterface[], dessert: RecipeDocumentInterface[] } = { starter: [], mainCourse: [], dessert: [] };

  for (let i = 0; i < days; i++) {
    const starter = getRandomRecipe(starters, usedRecipes.starter);
    const mainCourse = getRandomRecipe(mainCourses, usedRecipes.mainCourse);
    const dessert = getRandomRecipe(desserts, usedRecipes.dessert);

    usedRecipes.starter.push(starter._id.toString());
    usedRecipes.mainCourse.push(mainCourse._id.toString());
    usedRecipes.dessert.push(dessert._id.toString());

    plan.push({recipeStarterID: starter._id, recipeMainDishID: mainCourse._id, recipeDessertID: dessert._id, bread: false });
  }

  return plan;
};