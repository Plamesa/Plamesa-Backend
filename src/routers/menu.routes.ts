import * as express from "express";
import { Menu } from "../models/menu.js";

export const menuRouter = express.Router();

/** Añadir un menu */
menuRouter.post("/menu", async (req, res) => {
  try {
    const menu = new Menu({
      ...req.body,
    });

    // Añadir menu a la BD
    await menu.save();
    return res.status(201).send(menu);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/** Obtener todos los menus */
menuRouter.get("/menu", async (req, res) => {
  try {
    const menus = await Menu.find();

    // Mandar el resultado al cliente
    if (menus) {
      return res.status(200).send(menus);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});