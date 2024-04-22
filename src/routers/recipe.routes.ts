import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Ingredient } from "../models/ingredient.js";
import { Allergen } from "../models/enum/allergen.js";
import { IncompatibilidadAlimenticia } from "../models/enum/incompatibilidadAlimenticia.js";
import { User } from "../models/user.js";

export const recipeRouter = express.Router();

/** Añadir una receta */
recipeRouter.post("/recipe", async (req, res) => {
  try {
    const requiredIngredients: {
      ingredientID: string;
      amount: number;
    }[] = req.body.ingredients;
    let estimatedCost: number = 0;
    let allergens: Allergen[] = [];
    const nutrients: { name: string; amount: number;}[] = [];

    // Buscamos los ingredientes, los incluimos y calculamos sus parametros para la receta
    for (let i = 0; i < requiredIngredients.length; i++) {
      const { ingredientID, amount } = requiredIngredients[i];
      const ingredientObj = await Ingredient.findById(ingredientID);

      if (!ingredientObj) {
        return res.status(404).send({
          error: "Ingrediente no encontrado",
        });
      }

      // Calcular el costeEstimado a partir del coste de cada ingrediente
      estimatedCost += (ingredientObj.estimatedCost * amount) / ingredientObj.amount;

      // Añadir los alergenos a partir de los alergenos de los ingredientes
      ingredientObj.allergens.forEach((allergen) => {
        if (!allergens.includes(allergen)) {
          allergens.push(allergen);
        }
      });

      // Añadir los nutrientes a partir de los ingredientes
      ingredientObj.nutrients.forEach((nutrient) => {
        // Verificar si el nutriente ya está presente
        const existingNutrienteIndex = nutrients.findIndex(
          (n) => n.name === nutrient.name,
        );

        if (existingNutrienteIndex === -1) {
          nutrients.push({
            name: nutrient.name,
            amount: (amount * nutrient.amount) / ingredientObj.amount,
          });
        } else {
          nutrients[existingNutrienteIndex].amount +=
            (amount * nutrient.amount) / ingredientObj.amount;
        }
      });
    }

    // Buscar usuario propietario
    const user = await User.findOne({_id: req.body.ownerUser});
    if (!user) {
      return res.status(404).send({
        error: "Usuario no encontrado"
      });
    }

    req.body.ownerUser = user;
    req.body.estimatedCost = estimatedCost;
    req.body.allergens = allergens;
    req.body.nutrients = nutrients;
    const recipe = new Recipe(req.body);

    // Añadir Receta a la BD
    await recipe.save();

    // Incluimos la receta en la lista de recetas creadas del usuario
    user.createdRecipes.push(recipe._id);
    await User.findOneAndUpdate(user._id, {createdRecipes: user.createdRecipes}, {
      new: true,
      runValidators: true
    })

    return res.status(201).send(recipe);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener todos las recetas o por nombre */
recipeRouter.get("/recipe", async (req, res) => {
  try {
    let recipes: RecipeDocumentInterface | RecipeDocumentInterface[] | null;
    if (req.query.nombre) {
      recipes = await Recipe.findOne({
        nombre: req.query.nombre,
      }).populate({
        path: "ingredients",
        populate: {
          path: "ingredientID",
          model: "Ingredient",
          select: "name",
        },
      });
    } else {
      recipes = await Recipe.find().populate([
        {
          path: "ingredients",
          populate: {
            path: "ingredientID",
            model: "Ingredient",
            select: "name",
          },
        }, 
        {
          path: "ownerUser",
          model: "User",
          select: "username"
        }
      ]);
    }

    // Mandar el resultado al cliente
    if (recipes) {
      res.status(200).send(recipes);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
