import { Document, Schema, model } from "mongoose";
import { IngredientDocumentInterface } from "./ingredient.js";
import { RecipeDocumentInterface } from "./recipe.js";
import { Role } from "./enum/role.js";
import { MenuDocumentInterface } from "./menu.js";
import { Allergen } from "./enum/allergen.js";
import { Diet } from "./enum/diet.js";
import { ActivityLevel, Gender } from "./enum/userData.js";

/** Definición de la interfaz de documento de usuario */
export interface UserDocumentInterface extends Document {
  username: string;
  name: string;
  password: string;
  email: string;
  role: Role;
  allergies: Allergen[];
  diet: Diet;
  excludedIngredients: IngredientDocumentInterface[];
  gender: Gender;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
  createdIngredients: IngredientDocumentInterface[];
  createdRecipes: RecipeDocumentInterface[];
  favoriteRecipes: RecipeDocumentInterface[];
  savedMenus: MenuDocumentInterface[]
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
  allergies: {
    type: [String],
    enum: Object.values(Allergen),
    trim: true,
  },
  diet: {
    type: String,
    enum: Object.values(Diet),
    trim: true,
  },
  excludedIngredients: {
    type: [Schema.Types.ObjectId],
    ref: "Ingredient",
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    trim: true,
  },
  weight: {
    type: Number,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El peso no puede ser negativo");
      }
    },
  },
  height: {
    type: Number,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("La altura no puede ser negativa");
      }
    },
  },
  age: {
    type: Number,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("La edad no puede ser negativa");
      }
    },
  },
  activityLevel: {
    type: String,
    enum: Object.values(ActivityLevel),
    trim: true,
  },
  createdIngredients: {
    type: [Schema.Types.ObjectId],
    ref: "Ingredient",
  },
  createdRecipes: {
    type: [Schema.Types.ObjectId],
    ref: "Recipes",
  },
  favoriteRecipes: {
    type: [Schema.Types.ObjectId],
    ref: "Recipes",
  },
  savedMenus: {
    type: [Schema.Types.ObjectId],
    ref: "Menu",
  },
});

export const User = model<UserDocumentInterface>(
  "User",
  UserSchema,
);
