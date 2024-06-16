import * as express from "express";
import { Menu } from "../models/menu.js";
import { verifyJWT } from "../utils/verifyJWT.js";
import { User } from "../models/user.js";
import { RecipesPerDay } from "../models/enum/recipesPerDay.js";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { Role } from "../models/enum/role.js";
import { Ingredient, IngredientDocumentInterface } from "../models/ingredient.js";

export const menuRouter = express.Router();

/** Añadir un menu */
menuRouter.post("/menu", async (req, res) => {
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

    // Comprobar longitud de vector recetas sea igual a numero de días
    if (req.body.recipesPerDay.length != req.body.numberDays) {
      return res.status(400).send("Numero de recipesPerDays debe ser igual al numero de días"); // Usuario no autorizado
    }

    // Buscamos las recetas y las comprobamos
    const recipesPerDay: RecipesPerDay[] = req.body.recipesPerDay;
    for (let i = 0; i < recipesPerDay.length; i++) {
      const recipesIDs: RecipeDocumentInterface[] = [recipesPerDay[i].recipeStarterID, recipesPerDay[i].recipeMainDishID, recipesPerDay[i].recipeDessertID];
      for (let j = 0; j < recipesIDs.length; j++) {
        const recipeObj = await Recipe.findById(recipesIDs[j]);

        if (!recipeObj) {
          return res.status(404).send({
            error: "Receta no encontrada",
          });
        }
      }
    }

    // Buscamos los ingredientes y las comprobamos
    if (req.body.excludedIngredients) {
      const ingredients: string[] = req.body.excludedIngredients;
      for (let i = 0; i < ingredients.length; i++) {
        const ingredientObj = await Ingredient.findById(ingredients[i]);

        if (!ingredientObj) {
          return res.status(404).send({
            error: "Ingrediente no encontrado",
          });
        }
      }
    }
    

    // Añadir menu a la BD
    req.body.ownerUser = user._id;
    const menu = new Menu(req.body);
    await menu.save();

    // Incluimos el menu en la lista de menus guardados del usuario
    user.savedMenus.push(menu._id);
    await User.findOneAndUpdate(user._id, {savedMenus: user.savedMenus}, {
      new: true,
      runValidators: true
    })

    await menu.populate({
      path: 'ownerUser',
      select: ['username']
    });

    return res.status(201).send(menu);
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Obtener todos los menus solo role administrador*/
menuRouter.get("/menu", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Verificar token, buscar usuario y comprobar role de admin
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin ) {
      return res.status(401).send("No autorizado para ver todos los menus"); // Usuario no autorizado
    }

    // Buscar menus
    const menus = await Menu.find();

    // Populates
    for (let i = 0; i < menus.length; i++) {
      await menus[i].populate([
        {
          path: "recipesPerDay",
          populate: [
            {
              path: "recipeStarterID",
              select: "name",
            },
            {
              path: "recipeMainDishID",
              select: "name",
            },
            {
              path: "recipeDessertID",
              select: "name",
            }
          ]
        }, 
        {
          path: 'ownerUser',
          select: ['username']
        }
      ]);
    }
    
    // Mandar el resultado al cliente
    if (menus) {
      return res.status(200).send(menus);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});


/** Obtener un menu por id*/
menuRouter.get("/menu/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el menu
    const menu = await Menu.findOne({_id: req.params.id})
    if (!menu) {
      return res.status(404).send("Menu no encontrado");
    }

    // Verificar token, buscar usuario y comprobar role de admin
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== menu.ownerUser.toString()) {
      return res.status(401).send("No autorizado para ver el menu"); // Usuario no autorizado
    }

    // Populates
    await menu.populate([
      {
        path: "recipesPerDay",
        populate: [
          {
            path: "recipeStarterID",
            select: "name",
          },
          {
            path: "recipeMainDishID",
            select: "name",
          },
          {
            path: "recipeDessertID",
            select: "name",
          }
        ]
      }, 
      {
        path: 'ownerUser',
        select: ['username']
      }
    ]);

    return res.status(200).send(menu);
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Actualizar un menu a través de su id */
menuRouter.patch('/menu/:id', async (req, res) => {   
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el menu
    const menu = await Menu.findOne({_id: req.params.id});
    if (!menu) {
      return res.status(404).send({
        error: "Menu no encontrado"
      });
    }

    // Verificar si el usuario que intenta actualizar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== menu.ownerUser.toString()) {
      return res.status(401).send("No autorizado para actualizar este menu"); // Usuario no autorizado
    }

    // Verificar opciones de actualizado permitidas
    const allowedUpdates = ['title'];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).send({
        error: 'Opciones no permitidas',
      });
    }

    // Actualizar el menu
    const updateMenu = await Menu.findOneAndUpdate (menu._id, req.body, {
      new: true,
      runValidators: true
    })

    if (updateMenu) {
      await updateMenu.populate({
        path: 'ownerUser',
        select: ['username']
      });
      
      return res.status(201).send(updateMenu);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Eliminar un menu de la BD por id */
menuRouter.delete("/menu/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el menu
    const menu = await Menu.findOne({_id: req.params.id})
    if (!menu) {
      return res.status(404).send("Menu no encontrado");
    }
    
    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== menu.ownerUser.toString()) {
      return res.status(401).send("No autorizado para eliminar este menu"); // Usuario no autorizado
    }

    // Eliminar el menu de la lista de menus guardados del usuario
    const indexMenu = user.savedMenus.findIndex(men => men._id.equals(menu._id));
    if (indexMenu !== -1) {
      user.savedMenus.splice(indexMenu, 1);
    }

    await User.findOneAndUpdate(user._id, {savedMenus: user.savedMenus}, {
      new: true,
      runValidators: true
    })

    // Eliminar el menu
    const deletedMenu = await Menu.findOneAndDelete({
      _id: req.params.id,
    });

    if (deletedMenu) {
      return res.status(200).send(deletedMenu);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});