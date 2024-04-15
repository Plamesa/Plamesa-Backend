import * as express from "express";
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