import jwt from 'jsonwebtoken';
import { User, UserDocumentInterface } from '../models/user.js';

// Clave secreta para verificar JWT
const SECRET_KEY = 'secreto';

// Función para verificar si el usuario es administrador
export const verifyJWT = async (token: string): Promise<UserDocumentInterface> => {
  try {
    // Decodificar el token JWT
    const decodedToken = jwt.verify(token, SECRET_KEY) as any;

    const usernameFromToken = decodedToken.username;

    // Buscar el usuario en la base de datos usando el nombre de usuario del token
    const user = await User.findOne({ username: usernameFromToken });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return user;
  } catch (err) {
    throw new Error("Token no válido o acceso no autorizado");
  }
};