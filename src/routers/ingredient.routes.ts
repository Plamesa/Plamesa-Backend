import * as express from "express";
import { Ingredient, IngredientDocumentInterface } from "../models/ingredient.js";

export const ingredientRouter = express.Router();

// Add a ingredient
ingredientRouter.post("/ingredient", async (req, res) => {
  try {
    const ingredient = new Ingredient({
      ...req.body,
    });

    // Adds the ingredient to the database
    await ingredient.save();
    return res.status(201).send(ingredient);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets all ingredients
ingredientRouter.get("/ingredient", async (req, res) => {
  try {
    // Checks if fish exists
    const ingredients = await Ingredient.find();

    // Sends the result to the client
    if (ingredients) {
      return res.status(200).send(ingredients);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});