import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Ingredient } from "../models/ingredient.js";
import { Alergeno } from "../models/enum/alergeno.js";
import { IncompatibilidadAlimenticia } from "../models/enum/incompatibilidadAlimenticia.js";

export const recipeRouter = express.Router();

/** Añadir una receta */
recipeRouter.post("/recipe", async (req, res) => {
  try {
    const ingredientesRequeridos: {
      IdIngrediente: string;
      cantidad: number;
      unidad: string;
    }[] = req.body.ingredientes;
    let costeEstimado: number = 0;
    let alergenos: Alergeno[] = [];
    let incompatibilidadesAlimenticias: IncompatibilidadAlimenticia[] = [];
    const nutrientes: { nombre: string; cantidad: number; unidad: string }[] =
      [];

    for (let i = 0; i < ingredientesRequeridos.length; i++) {
      const { IdIngrediente, cantidad } = ingredientesRequeridos[i];
      const ingredientObj = await Ingredient.findById(IdIngrediente);

      if (!ingredientObj) {
        return res.status(404).send({
          error: "Ingrediente no encontrado",
        });
      }

      // Calcular el costeEstimado a partir del coste de cada ingrediente
      costeEstimado +=
        (ingredientObj.costeEstimado * cantidad) / ingredientObj.cantidad;
      req.body.ingredientes[i].unidad = ingredientObj.unidad;

      // Añadir los alergenos a partir de los alergenos de los ingredientes
      ingredientObj.alergenos.forEach((alergeno) => {
        if (!alergenos.includes(alergeno)) {
          alergenos.push(alergeno);
        }
      });

      // Añadir las incompatibilidadesAlimenticias a partir de las incompatibilidadesAlimenticias de los ingredientes
      ingredientObj.incompatibilidadesAlimenticias.forEach(
        (incompatibilidadAlimenticia) => {
          if (
            !incompatibilidadesAlimenticias.includes(
              incompatibilidadAlimenticia,
            )
          ) {
            incompatibilidadesAlimenticias.push(incompatibilidadAlimenticia);
          }
        },
      );

      ingredientObj.nutrientes.forEach((nutriente) => {
        // Verificar si el nutriente ya está presente
        const existingNutrienteIndex = nutrientes.findIndex(
          (n) => n.nombre === nutriente.nombre,
        );

        if (existingNutrienteIndex === -1) {
          nutrientes.push({
            nombre: nutriente.nombre,
            cantidad: (cantidad * nutriente.cantidad) / ingredientObj.cantidad,
            unidad: nutriente.unidad,
          });
        } else {
          nutrientes[existingNutrienteIndex].cantidad +=
            (cantidad * nutriente.cantidad) / ingredientObj.cantidad;
        }
      });
    }

    req.body.costeEstimado = costeEstimado;
    req.body.alergenos = alergenos;
    req.body.incompatibilidadesAlimenticias = incompatibilidadesAlimenticias;
    req.body.nutrientes = nutrientes;
    const recipe = new Recipe(req.body);

    // Añadir Receta a la BD
    await recipe.save();
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
        path: "ingredientes",
        populate: {
          path: "IdIngrediente",
          model: "Ingredient",
          select: "ID nombre",
        },
      });
    } else {
      recipes = await Recipe.find().populate({
        path: "ingredientes",
        populate: {
          path: "IdIngrediente",
          model: "Ingredient",
          select: "ID nombre",
        },
      });
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
