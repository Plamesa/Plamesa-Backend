import * as express from "express";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const loginRouter = express.Router();

loginRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar usuario y contraseña contra BD
    const user = await User.findOne({username: username});
    if (!user) {
      return res.status(404).send({
        error: "Usuario no encontrado"
      });
    }

    // Aplicar hash para contraseña almacenada y comprobar que coincide
    const isMatch = await bcrypt.compare(password, user.password);

    if (username === user.username && isMatch) {
      const userID = user._id;
      const token = jwt.sign({ userID }, 'secreto', { expiresIn: '1h' });
      return res.json({ token });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  }
  catch (error) {
    return res.status(500).send(error);
  }
});