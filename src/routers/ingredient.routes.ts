import * as express from "express";
import {
  Ingredient,
  IngredientDocumentInterface,
} from "../models/ingredient.js";
import { User } from "../models/user.js";
import { Recipe } from "../models/recipe.js";
import { Role } from "../models/enum/role.js";
import { verifyJWT } from "../utils/verifyJWT.js";
import { Allergen } from "../models/enum/allergen.js";
import { Nutrient } from "../models/enum/nutrients.js";

export const ingredientRouter = express.Router();

/** Añadir un ingrediente */
ingredientRouter.post("/ingredient", async (req, res) => {
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
ingredientRouter.get("/ingredient/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      _id: req.params.id,
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




/** Actualizar un ingrediente a través de su id */
ingredientRouter.patch('/ingredient/:id', async (req, res) => {   
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    const ingredient = await Ingredient.findOne({_id: req.params.id});
    if (!ingredient) {
      return res.status(404).send({
        error: "Ingrediente no encontrado"
      });
    }

    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== ingredient.ownerUser.toString()) {
      return res.status(401).send("No autorizado para eliminar este ingrediente"); // Usuario no autorizado
    }

    const allowedUpdates = ['name', 'amount', 'unit', 'estimatedCost', 'foodGroup', 'allergens', 'nutrients'];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).send({
        error: 'Opciones no permitidas',
      });
    }

    // Validar la estructura del modelo de datos
    try {
      const duplicateIngredient = await Ingredient.findOne({name: req.body.name});
      if (duplicateIngredient && req.body.name !== ingredient.name) {
        return res.status(404).send({ error: "Nombre de ingrediente ya existente" });
      }

      const mergedData = { ...ingredient.toObject(), ...req.body };
      const missingNutrients = ingredient.nutrients.filter(
        (originalNutrient) => 
          !req.body.nutrients.some((newNutrient: Nutrient) => 
            newNutrient.name === originalNutrient.name
          )
      );
      mergedData.nutrients.push(...missingNutrients);
      const ingredientTest = new Ingredient(mergedData); // Intenta crear una instancia con los datos entrantes

      await ingredientTest.validate(); 
    } catch(error) {
      return res.status(400).send({ error: error.message });
    }


    // En caso de que se modifique el coste estimado y/o la cantidad del ingrediente
    if (req.body.estimatedCost || req.body.amount) { // Si se modifican la cantidad, se modifican los datos de los recetas con este ingrediente
      const newCost: number = (req.body.estimatedCost ? req.body.estimatedCost : ingredient.estimatedCost);
      const newAmount: number = (req.body.amount ? req.body.amount : ingredient.amount);
      const recipesUsingIngredient = await Recipe.find({
        'ingredients.ingredientID': ingredient._id,
      });
      
      for (let i = 0; i < recipesUsingIngredient.length; i++) {
        // Recalcular el nuevo coste estimado a partir del cambio de cantidad del ingrediente
        let newEstimatedCostRecipe = recipesUsingIngredient[i].estimatedCost;
        const foundIngredientFromRecipe = recipesUsingIngredient[i].ingredients.find(ingred => ingred.ingredientID.equals(ingredient._id));
        if (foundIngredientFromRecipe) {
          const lastCostIngredient = foundIngredientFromRecipe.amount * ingredient.estimatedCost / ingredient.amount;
          const newCostIngredient = foundIngredientFromRecipe.amount * newCost / newAmount;
          newEstimatedCostRecipe = newEstimatedCostRecipe - lastCostIngredient + newCostIngredient;
        }
        
        await Recipe.findOneAndUpdate(recipesUsingIngredient[i]._id, {estimatedCost: newEstimatedCostRecipe}, {
          new: true,
          runValidators: true
        })
      }
    }

    // En caso de que se modifiquen los alergenos se modifican en las recetas asociadas
    if (req.body.allergens) { // Si se modifican los alergenos, se modifican los datos de los recetas con este ingrediente
      const recipesUsingIngredient = await Recipe.find({
        'ingredients.ingredientID': ingredient._id,
      });

      // Encuentra los alérgenos añadidos y eliminados
      const allergensAdded = req.body.allergens.filter((allergen: Allergen) => !ingredient.allergens.includes(allergen));
      const allergensRemoved = ingredient.allergens.filter((allergen: Allergen) => !req.body.allergens.includes(allergen));
      
      // Recorer las recetas con el ingrediente asociado
      for (let i = 0; i < recipesUsingIngredient.length; i++) {
        let newallergensRecipe = recipesUsingIngredient[i].allergens;

        // Añadir los nuevos alergenos si no estaban añadidos
        allergensAdded.forEach((allergen: Allergen) => {
          if (!newallergensRecipe.includes(allergen)) {
            newallergensRecipe.push(allergen);
          }
        });

        // Borrar los alergenos en caso de que no esten en de otro ingrediente tmb
        for (let j = 0; j < allergensRemoved.length; j++) {
          const allergen = allergensRemoved[j];
        
          // Obtener ingredientes de la receta que no son el ingrediente a modificar
          const otherIngredients = recipesUsingIngredient[i].ingredients.filter(
            (ing) => ing.ingredientID.toString() !== ingredient._id.toString()
          );
        
          let otherIngredientsAllergens: Allergen[][] = []; // Para cada ingrediente, obtener sus alérgenos
          for (let k = 0; k < otherIngredients.length; k++) {
            const ingredientID = otherIngredients[k].ingredientID;
            const ingredientAux = await Ingredient.findOne({ _id: ingredientID });
        
            if (ingredientAux) {
              otherIngredientsAllergens.push(ingredientAux.allergens);
            }
          }
        
          // Comprobar si el alérgeno está en otros ingredientes
          const allergenExistsInOthers = otherIngredientsAllergens.some((allergensList) =>
            allergensList.includes(allergen)
          );
        
          if (!allergenExistsInOthers) { // Si el alérgeno no está en otros ingredientes, eliminarlo de la receta
            newallergensRecipe = newallergensRecipe.filter(
              (existingAllergen) => existingAllergen !== allergen
            );
          }
        }

        await Recipe.findOneAndUpdate(recipesUsingIngredient[i]._id, {allergens: newallergensRecipe}, {
          new: true,
          runValidators: true
        })
      }
    }

    // En caso de que se modifique los nutrientes y/o la cantidad del ingrediente
    if (req.body.nutrients || req.body.amount) { // Si se modifican la cantidad, se modifican los datos de los recetas con este ingrediente
      const newNutrientsBody: Nutrient[] = (req.body.nutrients ? req.body.nutrients : ingredient.nutrients);
      const newAmountBody: number = (req.body.amount ? req.body.amount : ingredient.amount);
      const recipesUsingIngredient = await Recipe.find({
        'ingredients.ingredientID': ingredient._id,
      });
      
      for (let i = 0; i < recipesUsingIngredient.length; i++) {
        let newNutrientsRecipe = recipesUsingIngredient[i].nutrients;

        for (let j = 0; j < newNutrientsBody.length; j++) {
          const foundIngredientFromRecipe = recipesUsingIngredient[i].ingredients.find(ingred => ingred.ingredientID.equals(ingredient._id));
          let nutrientFromRecipeIndex =  recipesUsingIngredient[i].nutrients.findIndex(
            (nutrient) => nutrient.name === newNutrientsBody[j].name
          );
          let lastNutrientFromIngredient =  ingredient.nutrients.find(
            (nutrient) => nutrient.name === newNutrientsBody[j].name
          );
          if (nutrientFromRecipeIndex != -1 && lastNutrientFromIngredient && foundIngredientFromRecipe) {
            const lastNutrientValueRecipe = foundIngredientFromRecipe.amount * lastNutrientFromIngredient.amount / ingredient.amount;
            const nerNutrientValueRecipe = foundIngredientFromRecipe.amount * newNutrientsBody[j].amount / newAmountBody;
            newNutrientsRecipe[nutrientFromRecipeIndex].amount = newNutrientsRecipe[nutrientFromRecipeIndex].amount - lastNutrientValueRecipe + nerNutrientValueRecipe;
          }
          else if (nutrientFromRecipeIndex = -1) {
            newNutrientsRecipe.push(newNutrientsBody[j]);
          }
        }
        
        //console.log(newNutrientsRecipe)
        await Recipe.findOneAndUpdate(recipesUsingIngredient[i]._id, {nutrients: newNutrientsRecipe}, {
          new: true,
          runValidators: true
        })
      }
    }


    const updateIngredient = await Ingredient.findOneAndUpdate (ingredient._id, req.body, {
      new: true,
      runValidators: true
    })

    if (updateIngredient) {
      await updateIngredient.populate({
        path: 'ownerUser',
        select: ['username']
      });
      
      return res.status(201).send(updateIngredient);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Eliminar un ingrediente de la BD por id */
ingredientRouter.delete("/ingredient/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el ingrediente
    const ingredient = await Ingredient.findOne({_id: req.params.id})
    if (!ingredient) {
      return res.status(404).send("Ingrediente no encontrado");
    }
    
    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== ingredient.ownerUser.toString()) {
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

    // Eliminar el ingrediente de la lista de ingredientes creados del usuario
    const indexIngredient = user.createdIngredients.findIndex(ingred => {ingred._id === ingredient._id});
    user.createdIngredients.splice(indexIngredient, 1);

    await User.findOneAndUpdate(user._id, {createdIngredients: user.createdIngredients}, {
      new: true,
      runValidators: true
    })

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
