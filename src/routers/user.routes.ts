import * as express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { verifyJWT } from "../utils/verifyJWT.js";
import { Role } from "../models/enum/role.js";
import { Menu } from "../models/menu.js";
import { Ingredient, IngredientDocumentInterface } from "../models/ingredient.js";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";

export const userRouter = express.Router();

/** Añadir un usuario */
userRouter.post("/user", async (req, res) => {
  try {
    const saltRounds = 10;
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Guardar usuario
    req.body.password = hashedPassword;
    const user = new User(req.body);

    // Añadir usuario a la BD
    await user.save();
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Obtener todos los usuarios solo role administrador */
userRouter.get("/user", async (req, res) => {
  try {
    // Existe token de autorizacion
    /*const authHeader = req.headers['authorization'];
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
      return res.status(401).send("No autorizado para ver todos los usuarios"); // Usuario no autorizado
    }*/

    const users = await User.find().populate([
      {
        path: "excludedIngredients",
        model: "Ingredient",
        select: "_id, name"
      },
      {
        path: "createdIngredients",
        model: "Ingredient",
        select: "_id, name"
      },
      {
        path: "createdRecipes",
        model: "Recipe",
        select: "_id, name"
      },
      {
        path: "favoriteRecipes",
        model: "Recipe",
        select: "_id, name"
      }
    ])

    // Mandar el resultado al cliente
    if (users) {
      return res.status(200).send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});


/** Obtener un usuario por id*/
userRouter.get("/user/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el usuario
    const userToShow = await User.findOne({_id: req.params.id}).populate([
      {
        path: "excludedIngredients",
        model: "Ingredient",
        select: "_id, name"
      },
      {
        path: "createdIngredients",
        model: "Ingredient",
        select: "_id, name"
      },
      {
        path: "createdRecipes",
        model: "Recipe",
        select: "_id, name"
      },
      {
        path: "favoriteRecipes",
        model: "Recipe",
        select: "_id, name"
      }
    ])
    if (!userToShow) {
      return res.status(404).send("Menu no encontrado");
    }

    // Verificar token, buscar usuario y comprobar role de admin
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== userToShow._id.toString()) {
      return res.status(401).send("No autorizado para ver el usuario"); // Usuario no autorizado
    }

    return res.status(200).send(userToShow);
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Actualizar un usuario a través de su id */
userRouter.patch('/user/:id', async (req, res) => {   
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el usuario
    const userToUpdate = await User.findOne({_id: req.params.id});
    if (!userToUpdate) {
      return res.status(404).send({
        error: "Usuario no encontrado"
      });
    }

    // Verificar si el usuario que intenta actualizar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== userToUpdate._id.toString()) {
      return res.status(401).send("No autorizado para actualizar este usuario"); // Usuario no autorizado
    }

    // Verificar opciones de actualizado permitidas
    const allowedUpdates = ['username', 'name', 'password', 'email', 'allergies', 'diet', 'excludedIngredients', 'gender', 'weight', 'height', 'age', 'activityLevel', 'favoriteRecipes'];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).send({
        error: 'Opciones no permitidas',
      });
    }
    
    // Buscamos los ingredientes y los comprobamos
    if (req.body.excludedIngredients) {
      const ingredientsIDS: IngredientDocumentInterface[] = req.body.excludedIngredients;
      for (let i = 0; i < ingredientsIDS.length; i++) {
        const ingredientObj = await Ingredient.findById(ingredientsIDS[i]);

        if (!ingredientObj) {
          return res.status(404).send({
            error: "Ingrediente no encontrado",
          });
        }
      }
    }

    // Buscamos las recetas y las comprobamos
    if (req.body.favoriteRecipes) {
      const recipeIDS: RecipeDocumentInterface[] = req.body.favoriteRecipes;
      for (let i = 0; i < recipeIDS.length; i++) {
        const recipeObj = await Recipe.findById(recipeIDS[i]);

        if (!recipeObj) {
          return res.status(404).send({
            error: "Receta no encontrada",
          });
        }
      }
    }

    if (req.body.password) {
      const saltRounds = 10;
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      req.body.password = hashedPassword;
    }

    // Actualizar el menu
    const updateUser = await User.findOneAndUpdate(userToUpdate._id, req.body, {
      new: true,
      runValidators: true
    })

    if (updateUser) {
      return res.status(201).send(updateUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Eliminar un usuario de la BD por id */
userRouter.delete("/user/:id", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el usuario
    const userToDelete = await User.findOne({_id: req.params.id})
    if (!userToDelete) {
      return res.status(404).send("Usuario no encontrado");
    }
    
    // Verificar si el usuario que intenta eliminar es administrador o el propietario
    const user = await verifyJWT(token);
    if (!user) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }
    if (user.role != Role.Admin && user._id.toString() !== userToDelete._id.toString()) {
      return res.status(401).send("No autorizado para eliminar este usuario"); // Usuario no autorizado
    }

    // Cambiar de propietario los ingredientes creados
    for (let i = 0; i < userToDelete.createdIngredients.length; i++) {
      // Buscar un usuario con rol de administrador, excluyendo al usuario a eliminar
      const adminUser = await User.findOne({ 
        role: Role.Admin, 
        _id: { $ne: userToDelete._id } // Excluir usuario a eliminar
      });

      if (!adminUser) {
        return res.status(401).send("No se puedo eliminar por falta de administrador");
      }

      // Cambiar propietario en el ingrediente
      await Ingredient.findOneAndUpdate(userToDelete.createdIngredients[i]._id, {ownerUser: adminUser._id}, {
        new: true,
        runValidators: true
      })

      // Añadir el ingrediente a los creados por el usuario admin
      adminUser.createdIngredients.push(userToDelete.createdIngredients[i]._id);
      await User.findOneAndUpdate(adminUser._id, {createdIngredients: adminUser.createdIngredients}, {
        new: true,
        runValidators: true
      })
    }

    // Cambiar de propietario las recetas creadas
    for (let i = 0; i < userToDelete.createdRecipes.length; i++) {
      // Buscar un usuario con rol de administrador, excluyendo al usuario a eliminar
      const adminUser = await User.findOne({ 
        role: Role.Admin, 
        _id: { $ne: userToDelete._id } // Excluir usuario a eliminar
      });

      if (!adminUser) {
        return res.status(401).send("No se puedo eliminar por falta de administrador");
      }

      // Cambiar propietario en la receta
      await Recipe.findOneAndUpdate(userToDelete.createdRecipes[i]._id, {ownerUser: adminUser._id}, {
        new: true,
        runValidators: true
      })

      // Añadir la receta a las creadas por el usuario admin
      adminUser.createdRecipes.push(userToDelete.createdRecipes[i]._id);
      await User.findOneAndUpdate(adminUser._id, {createdRecipes: adminUser.createdRecipes}, {
        new: true,
        runValidators: true
      })
    }

    // Eliminar los menus guardados del usuario
    for (let i = 0; i < userToDelete.savedMenus.length; i++) {
      await Menu.findOneAndDelete({_id: userToDelete.savedMenus[i]});
    }

    // Eliminar el usuario
    const deletedUser = await User.findOneAndDelete({
      _id: req.params.id,
    });

    if (deletedUser) {
      return res.status(200).send(deletedUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});