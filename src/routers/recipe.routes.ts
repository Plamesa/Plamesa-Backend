import * as express from "express";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Ingredient } from "../models/ingredient.js";
import { Allergen } from "../models/enum/allergen.js";
import { User } from "../models/user.js";
import { verifyJWT } from "../utils/verifyJWT.js";
import { Role } from "../models/enum/role.js";
import { Menu } from "../models/menu.js";

export const recipeRouter = express.Router();

/** Añadir una receta */
recipeRouter.post("/recipe", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Verificar token y buscar usuario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }

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

    // Convertir 'name' a minúsculas
    if (req.body.name) {
      req.body.name = req.body.name.toLowerCase();
    }

    // Añadir Receta a la BD
    req.body.ownerUser = user._id;
    req.body.estimatedCost = estimatedCost;
    req.body.allergens = allergens;
    req.body.nutrients = nutrients;
    const recipe = new Recipe(req.body);
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
    const recipes = await Recipe.find().populate([
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

    // Mandar el resultado al cliente
    if (recipes) {
      res.status(200).send(recipes);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});


/** Obtener recetas por id */
recipeRouter.get("/recipe/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({_id: req.params.id}).populate([
      {
        path: "ingredients",
        populate: {
          path: "ingredientID",
          model: "Ingredient",
          select:["name", "unit"],
        },
      },
      {
        path: "ownerUser",
        model: "User",
        select: "username"
      }
    ]);

    // Mandar el resultado al cliente
    if (recipe) {
      res.status(200).send(recipe);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Actualizar una receta a través de su id */
recipeRouter.patch('/recipe/:id', async (req, res) => {   
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar la receta
    const recipe = await Recipe.findOne({_id: req.params.id});
    if (!recipe) {
      return res.status(404).send({
        error: "Receta no encontrada"
      });
    }

    // Verificar si el usuario que intenta actualizar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== recipe.ownerUser.toString()) {
      return res.status(401).send("No autorizado para actualizar esta receta"); // Usuario no autorizado
    }

    // Verificar opciones de actualizado permitidas
    const allowedUpdates = ['name', 'numberService', 'preparationTime', 'foodType', 'instructions', 'comments', 'cookware', 'ingredients'];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).send({
        error: 'Opciones no permitidas',
      });
    }

    // En caso de que se modifique los ingredientes se recalculan los datos de la receta
    if (req.body.ingredients) { 
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
  
      req.body.estimatedCost = estimatedCost;
      req.body.allergens = allergens;
      req.body.nutrients = nutrients;
    }

    // Convertir 'name' a minúsculas
    if (req.body.name) {
      req.body.name = req.body.name.toLowerCase();
    }

    // Actualizar la receta
    const updateRecipe = await Recipe.findOneAndUpdate (recipe._id, req.body, {
      new: true,
      runValidators: true
    })

    if (updateRecipe) {
      await updateRecipe.populate({
        path: 'ownerUser',
        select: ['username']
      });
      
      return res.status(201).send(updateRecipe);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Eliminar una receta de la BD por id */
recipeRouter.delete("/recipe/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar la receta
    const recipe = await Recipe.findOne({_id: req.params.id})
    if (!recipe) {
      return res.status(404).send("Receta no encontrada");
    }
    
    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== recipe.ownerUser.toString()) {
      return res.status(401).send("No autorizado para eliminar este ingrediente"); // Usuario no autorizado
    }

    // Verificar si algun menu usa la receta
    const menusUsingRecipe = await Menu.find({
      $or: [
        { 'recipesPerDay.recipeStarterID': recipe._id },
        { 'recipesPerDay.recipeMainDishID': recipe._id },
        { 'recipesPerDay.recipeDessertID': recipe._id },
      ],
    });

    if (menusUsingRecipe.length > 0) {
      return res.status(400).send({
        error: `No se puede eliminar la receta porque está en uso por ${menusUsingRecipe.length} menu(s)`,
      });
    }

    // Eliminar la receta de la lista de recetas favoritas del cualquier usuario con esta receta
    await User.updateMany(
      { favoriteRecipes: recipe._id },
      { $pull: { favoriteRecipes: recipe._id } }
    );

    // Eliminar la receta de la lista de recetas creadas del usuario
    const indexRecipe = user.createdRecipes.findIndex(recip => {recip._id === recipe._id});
    user.createdRecipes.splice(indexRecipe, 1);

    await User.findOneAndUpdate(user._id, {createdRecipes: user.createdRecipes}, {
      new: true,
      runValidators: true
    })

    // Eliminar la receta
    const deletedRecipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
    });

    if (deletedRecipe) {
      return res.status(200).send(deletedRecipe);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});


recipeRouter.post('/recipeSearchPerIngredients', async (req, res) => {
  try {
    const ingredientsIDs = req.body.ingredients;
    let recipes = [];

    // Obtener todas las recetas que contienen al menos uno de los ingredientes
    const allMatchingRecipes = await Recipe.find({
      'ingredients.ingredientID': { $in: ingredientsIDs }
    })

    // Contar numero de ingredientes presentes en cada receta
    const recipesWithMatchCount = allMatchingRecipes.map(recipe => {
      const matchCount = recipe.ingredients.filter(ingredient => 
        ingredientsIDs.includes(ingredient.ingredientID.toString())
      ).length;
      return { recipe, matchCount };
    });

    // Ordenar las recetas por la cantidad de ingredientes coincidentes (de mayor a menor)
    recipesWithMatchCount.sort((a, b) => b.matchCount - a.matchCount);
    recipes = recipesWithMatchCount.slice(0, 5).map(item => item.recipe);

    // Enviar respuesta en formato JSON
    await Promise.all(
      recipes.map(recipe => 
        recipe.populate([
          {
            path: "ingredients",
            populate: {
              path: "ingredientID",
              model: "Ingredient",
              select: ["name", "unit"],
            },
          },
          {
            path: "ownerUser",
            model: "User",
            select: "username"
          }
        ])
      )
    );

    return res.json({ recipes });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});