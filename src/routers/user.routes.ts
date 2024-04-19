import * as express from "express";
import jwt from 'jsonwebtoken';
import {
  User,
  UserDocumentInterface,
} from "../models/user.js";

export const userRouter = express.Router();

/** Añadir un usuario */
userRouter.post("/user", async (req, res) => {
  try {
    const user = new User({
      ...req.body,
    });

    // Añadir usuario a la BD
    await user.save();
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener todos los usuarios o por nombre de usuario */
userRouter.get("/user", async (req, res) => {
  try {
    let users;
    if (req.query.username) {
      users = await User.findOne({
        username: req.query.username,
      });
    } else {
      users = await User.find();
    }

    // Mandar el resultado al cliente
    if (users) {
      return res.status(200).send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.get("/user/:id", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401); // Si no hay token, devolver un error de no autorizado
    }

    // Verificar el token JWT
    jwt.verify(token, 'secreto', async (err: jwt.VerifyErrors | null, decodedToken: any) => {
      if (err) {
        return res.sendStatus(403); // Si el token no es válido, devolver un error de prohibido
      }

      // Obtener el nombre de usuario del token decodificado
      const usernameFromToken = decodedToken.username;

      // Buscar al usuario en la base de datos usando el nombre de usuario del token
      const user = await User.findOne({ username: usernameFromToken });
      if (user) {
        return res.status(200).send(user);
      } else {
        return res.status(404).send();
      }
      
    });
    return 
  } catch (error) {
    return res.status(500).send(error);
  }
});