import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Allergen } from "../models/enum/allergen.js";
import { FoodType } from "../models/enum/FoodType.js";
import { ActivityLevel, Gender } from "../models/enum/userData.js";
import { RecipesPerDay } from "../models/enum/recipesPerDay.js";
import { Menu, MenuDocumentInterface } from "../models/menu.js";

export const recipeSearch = express.Router();

recipeSearch.post('/calcNutrientsUser', async (req, res) => {
  try {
    const { gender, weight, height, age, activityLevel } = req.body;

    // Calcular metabolismo basal
    let basalMetabolism: number;
    if (gender === Gender.Masculino) {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calcular total de kcal recomendadas
    const activityLevels: { [key in ActivityLevel]: number } = {
      [ActivityLevel.Sedentario]: 1.2,
      [ActivityLevel.Ligero]: 1.375,
      [ActivityLevel.Moderado]: 1.55,
      [ActivityLevel.Activo]: 1.725,
      [ActivityLevel.MuyActivo]: 1.9,
      [ActivityLevel.Vacio]: 0,
    };

    const totalKcal = basalMetabolism * activityLevels[activityLevel as ActivityLevel];

    // Calcular kcal para la comida (representa el 30% del total)
    const kcalPerMeal = totalKcal * 0.3;

    // Porcentaje de macros 
    const proteinMinPercentage = 0.1;
    const proteinMaxPercentage = 0.35;
    const carbMinPercentage = 0.45;
    const carbMaxPercentage = 0.65;
    const fatMinPercentage = 0.2;
    const fatMaxPercentage = 0.35;

    // Calcular cantidades de macros en gramos
    const proteinGramsMin = (kcalPerMeal * proteinMinPercentage) / 4; // 1g = 4 kcal
    const proteinGramsMax = (kcalPerMeal * proteinMaxPercentage) / 4;
    const carbGramsMin = (kcalPerMeal * carbMinPercentage) / 4; // 1g = 4 kcal
    const carbGramsMax = (kcalPerMeal * carbMaxPercentage) / 4; 
    const fatGramsMin = (kcalPerMeal * fatMinPercentage) / 9; // 1g = 9 kcal
    const fatGramsMax = (kcalPerMeal * fatMaxPercentage) / 9; 

    // Enviar respuesta en formato JSON
    return res.json({
      basalMetabolism,
      totalKcal,
      kcalPerMeal,
      macros: {
        proteinMin: {
          amount: proteinGramsMin,
          percentage: proteinMinPercentage,
        },
        proteinMax: {
          amount: proteinGramsMax,
          percentage: proteinMaxPercentage,
        },
        carbohydrateMin: {
          amount: carbGramsMin,
          percentage: carbMinPercentage,
        },
        carbohydrateMax: {
          amount: carbGramsMax,
          percentage: carbMaxPercentage,
        },
        fatMin: {
          amount: fatGramsMin,
          percentage: fatMinPercentage,
        },
        fatMax: {
          amount: fatGramsMax,
          percentage: fatMaxPercentage,
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});



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
    return res.json({ recipes });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});



recipeSearch.post('/planner', async (req, res) => {
  const {numberDays, numberServices, allergies, excludedIngredients } = req.body;

  if (!numberDays || !numberServices) {
    return res.status(400).send('Faltan parametros.');
  }

  try {
    const plan = await generateMealPlan(excludedIngredients, allergies,  numberDays);

    const today = new Date().toLocaleDateString();

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