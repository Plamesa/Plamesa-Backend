import * as express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { verifyJWT } from "../utils/verifyJWT.js";
import { Role } from "../models/enum/role.js";
import { Menu } from "../models/menu.js";
import { Ingredient, IngredientDocumentInterface } from "../models/ingredient.js";
import { Recipe, RecipeDocumentInterface } from "../models/recipe.js";
import { ActivityLevel, Gender } from "../models/enum/userData.js";

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
userRouter.get("/user/all", async (req, res) => {
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
      return res.status(401).send("No autorizado para ver todos los usuarios"); // Usuario no autorizado
    }

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


/** Obtener un usuario por el token*/
userRouter.get("/user", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Verificar token, buscar usuario
    const userToShow = await verifyJWT(token);
    if (!userToShow) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
    }

    // Buscar el usuario
    await userToShow.populate([
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
      return res.status(404).send("Usuario no encontrado");
    }

    userToShow.password = '';
    return res.status(200).send(userToShow);
  } catch (error) {
    return res.status(500).send(error);
  }
});




/** Actualizar un usuario a través de su id */
userRouter.patch('/user', async (req, res) => {   
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el usuario
    const userToUpdate = await verifyJWT(token);
    if (!userToUpdate) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
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
userRouter.delete("/user", async (req, res) => {
  try {
    // Existe token de autorizacion
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Buscar el usuario
    const userToDelete = await verifyJWT(token);
    if (!userToDelete) {
      return res.status(401).send("No autorizado"); // Usuario no autorizado
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
      _id: userToDelete._id,
    });

    if (deletedUser) {
      return res.status(200).send(deletedUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});



userRouter.post('/calcNutrientsUser', async (req, res) => {
  try {
    const { gender, weight, height, age, activityLevel } = req.body;

    // Calcular metabolismo basal
    let basalMetabolism: number;
    if (gender === Gender.Masculino) {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calcular total de kcal recomendadas
    const activityLevels: { [key in ActivityLevel]: number } = {
      [ActivityLevel.Sedentario]: 1.2,
      [ActivityLevel.Ligero]: 1.375,
      [ActivityLevel.Moderado]: 1.55,
      [ActivityLevel.Activo]: 1.725,
      [ActivityLevel.MuyActivo]: 1.9,
      [ActivityLevel.Vacio]: 0,
    };

    const totalKcal = basalMetabolism * activityLevels[activityLevel as ActivityLevel];

    // Calcular kcal para la comida (representa el 30% del total)
    const kcalPerMeal = totalKcal * 0.3;

    // Porcentaje de macros 
    const proteinMinPercentage = 0.1;
    const proteinMaxPercentage = 0.35;
    const carbMinPercentage = 0.45;
    const carbMaxPercentage = 0.65;
    const fatMinPercentage = 0.2;
    const fatMaxPercentage = 0.35;

    // Calcular cantidades de macros en gramos
    const proteinGramsMin = (kcalPerMeal * proteinMinPercentage) / 4; // 1g = 4 kcal
    const proteinGramsMax = (kcalPerMeal * proteinMaxPercentage) / 4;
    const carbGramsMin = (kcalPerMeal * carbMinPercentage) / 4; // 1g = 4 kcal
    const carbGramsMax = (kcalPerMeal * carbMaxPercentage) / 4; 
    const fatGramsMin = (kcalPerMeal * fatMinPercentage) / 9; // 1g = 9 kcal
    const fatGramsMax = (kcalPerMeal * fatMaxPercentage) / 9; 

    // Enviar respuesta en formato JSON
    return res.json({
      basalMetabolism,
      totalKcal,
      kcalPerMeal,
      macros: {
        proteinMin: {
          amount: proteinGramsMin,
          percentage: proteinMinPercentage,
        },
        proteinMax: {
          amount: proteinGramsMax,
          percentage: proteinMaxPercentage,
        },
        carbohydrateMin: {
          amount: carbGramsMin,
          percentage: carbMinPercentage,
        },
        carbohydrateMax: {
          amount: carbGramsMax,
          percentage: carbMaxPercentage,
        },
        fatMin: {
          amount: fatGramsMin,
          percentage: fatMinPercentage,
        },
        fatMax: {
          amount: fatGramsMax,
          percentage: fatMaxPercentage,
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});