import * as express from "express";
import jwt from 'jsonwebtoken';
import {
  Ingredient,
  IngredientDocumentInterface,
} from "../models/ingredient.js";
import { User } from "../models/user.js";
import { Recipe } from "../models/recipe.js";
import { Role } from "../models/enum/role.js";
import { verifyJWT } from "../utils/verifyJWT.js";

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
  if (!req.query.name) {
    return res.status(400).send({
      error: "Es necesario poner el nombre del ingrediente",
    });
  }

  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el ingrediente
    const ingredient = await Ingredient.findOne({name: req.query.name})
    if (!ingredient) {
      return res.status(404).send("Ingrediente no encontrado");
    }
    
    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== ingredient.ownerUser.toString()) {
      console.log(user._id, ingredient.ownerUser)
      return res.status(401).send("No autorizado para eliminar este ingrediente"); // Usuario no autorizado
    }

    // Verificar si alguna receta usa el ingrediente
    const recipesUsingIngredient = await Recipe.find({
      'ingredients.ingredientID': ingredient._id,
    });

    if (recipesUsingIngredient.length > 0) {
      return res.status(400).send({
        error: `No se puede eliminar el ingrediente porque está en uso por ${recipesUsingIngredient.length} receta(s)`,
      });
    }

    // Eliminar el ingrediente
    const deletedIngredient = await Ingredient.findOneAndDelete({
      name: req.query.name,
    });

    if (deletedIngredient) {
      return res.status(200).send(deletedIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
