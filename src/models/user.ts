import { Document, Schema, model } from "mongoose";

/** Definición de la interfaz de documento de usuario */
export interface UserDocumentInterface extends Document {
  username: string;
  name: string;
  password: string;
  email: string;
}

/** Definición del esquema de Mongoose para el usuario */
const UserSchema = new Schema<UserDocumentInterface>({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (!value.match(/^(?=.*[0-9])(?=.*[A-ZÑ])[a-zA-Z0-9Ññ]{6,}$/)) {
        throw new Error(
          "La contraseña debe tener al menos 6 caracteres, contener al menos un número y una letra mayúscula"
        );
      }
    },
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (!value.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
        throw new Error("Formato incorrecto en el email del usuario");
      }
    },
  },
});

export const User = model<UserDocumentInterface>(
  "User",
  UserSchema,
);
