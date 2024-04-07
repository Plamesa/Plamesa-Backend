import * as express from "express";
import {
  Ingredient,
  IngredientDocumentInterface,
} from "../models/ingredient.js";

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

// Gets all ingredients or by name
ingredientRouter.get("/ingredient", async (req, res) => {
  try {
    let ingredients;
    if (req.query.nombre) {
      ingredients = await Ingredient.findOne({
        nombre: req.query.nombre,
      });
    } else {
      ingredients = await Ingredient.find();
    }

    // Sends the result to the client
    if (ingredients) {
      return res.status(200).send(ingredients);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets ingredient by ID
ingredientRouter.get("/ingredient/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      ID: req.params.id,
    });

    if (ingredient) {
      return res.status(201).send(ingredient);
    } else {
      return res.status(404).send();
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Delete ingredient by ID
ingredientRouter.delete("/ingredient", async (req, res) => {
  if (!req.query.nombre) {
    return res.status(400).send({
      error: "Es necesario poner ingrediente",
    });
  }

  try {
    // Deletes the ingredient
    const deletedIngredient = await Ingredient.findOneAndDelete({
      nombre: req.query.nombre,
    });

    // Sends the result to the client
    if (deletedIngredient) {
      return res.status(200).send(deletedIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Delete ingredient by ID
ingredientRouter.delete("/ingredient/:id", async (req, res) => {
  try {
    // Deletes the ingredient
    const deletedIngredient = await Ingredient.findOneAndDelete({
      ID: req.params.id,
    });

    // Sends the result to the client
    if (deletedIngredient) {
      return res.status(200).send(deletedIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
