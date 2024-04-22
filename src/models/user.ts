import { Document, Schema, model } from "mongoose";
import { IngredientDocumentInterface } from "./ingredient.js";
import { RecipeDocumentInterface } from "./recipe.js";
import { Role } from "./enum/role.js";

/** Definición de la interfaz de documento de usuario */
export interface UserDocumentInterface extends Document {
  username: string;
  name: string;
  password: string;
  email: string;
  role: Role;
  createdIngredients: IngredientDocumentInterface[];
  createdRecipes: RecipeDocumentInterface[];
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
  role: {
    type: String,
    trim: true,
    required: true,
    enum: Object.values(Role),
  },
  createdIngredients: {
    type: [Schema.Types.ObjectId],
    ref: "Ingredient",
  },
  createdRecipes: {
    type: [Schema.Types.ObjectId],
    ref: "Recipes",
  },
});

export const User = model<UserDocumentInterface>(
  "User",
  UserSchema,
);
