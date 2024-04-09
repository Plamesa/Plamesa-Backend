import * as express from "express";
import {
  Ingredient,
  IngredientDocumentInterface,
} from "../models/ingredient.js";

export const ingredientRouter = express.Router();

/** Añadir un ingrediente */
ingredientRouter.post("/ingredient", async (req, res) => {
  try {
    const ingredient = new Ingredient({
      ...req.body,
    });

    // Añadir ingredientes a la BD
    await ingredient.save();
    return res.status(201).send(ingredient);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener todos los ingredientes o por nombre */
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

    // Mandar el resultado al cliente
    if (ingredients) {
      return res.status(200).send(ingredients);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener un ingrediente por ID */
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

/** Eliminar un ingrediente de la BD por nombre */
ingredientRouter.delete("/ingredient", async (req, res) => {
  if (!req.query.nombre) {
    return res.status(400).send({
      error: "Es necesario poner el nombre del ingrediente",
    });
  }

  try {
    // Eliminar el ingrediente
    const deletedIngredient = await Ingredient.findOneAndDelete({
      nombre: req.query.nombre,
    });

    // Mandar el resultado al cliente
    if (deletedIngredient) {
      return res.status(200).send(deletedIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Eliminar un ingrediente de la BD por ID */
ingredientRouter.delete("/ingredient/:id", async (req, res) => {
  try {
    // Eliminar el ingrediente
    const deletedIngredient = await Ingredient.findOneAndDelete({
      ID: req.params.id,
    });

    // Mandar el resultado al cliente
    if (deletedIngredient) {
      return res.status(200).send(deletedIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
