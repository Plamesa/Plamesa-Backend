import * as express from "express";
import { Recipe } from "../models/recipe.js";

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