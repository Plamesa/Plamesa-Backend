import * as express from "express";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.js";

export const loginRouter = express.Router();

loginRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Aquí deberías validar el nombre de usuario y la contraseña contra tu base de datos
    const user = await User.findOne({username: username});
    if (!user) {
      return res.status(404).send({
        error: "Usuario no encontrado"
      });
    }

    if (username === user.username && password === user.password) {
      // Si las credenciales son válidas, genera un token JWT
      const token = jwt.sign({ username }, 'secreto', { expiresIn: '1h' });
      return res.json({ token });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  }
  catch (error) {
    return res.status(500).send(error);
  }
});