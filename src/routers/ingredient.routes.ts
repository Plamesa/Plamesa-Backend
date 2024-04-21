import * as express from "express";
import {
  Ingredient,
  IngredientDocumentInterface,
} from "../models/ingredient.js";
import { User } from "../models/user.js";

export const ingredientRouter = express.Router();

/** Añadir un ingrediente */
ingredientRouter.post("/ingredient", async (req, res) => {
  try {
    // Buscar usuario propietario
    const user = await User.findOne({_id: req.body.ownerUser});
    if (!user) {
      return res.status(404).send({
        error: "Usuario no encontrado"
      });
    }

    // Añadir ingrediente en la BD
    req.body.name = req.body.name.toLowerCase();
    req.body.ownerUser = user;
    const ingredient = new Ingredient(req.body);
    await ingredient.save();

    // Incluimos el ingrediente en la lista de ingredientes creados del usuario
    user.createdIngredients.push(ingredient._id);
    await User.findOneAndUpdate(user._id, {createdIngredients: user.createdIngredients}, {
      new: true,
      runValidators: true
    })

    await ingredient.populate({
      path: 'ownerUser',
      select: ['username']
    });

    return res.status(201).send(ingredient);
  } catch (error) {
    return res.status(500).send(error);
  }
});


/** Obtener todos los ingredientes */
ingredientRouter.get("/ingredient", async (req, res) => {
  try {
    const ingredients = await Ingredient.find().populate({
      path: 'ownerUser',
      select: ['username']
    });

    // Mandar el resultado al cliente
    if (ingredients) {
      return res.status(200).send(ingredients);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener un ingrediente por name */
ingredientRouter.get("/ingredient/:name", async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      name: req.params.name,
    }).populate({
      path: 'ownerUser',
      select: ['username']
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
