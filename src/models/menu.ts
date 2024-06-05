import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { RecipesPerDay } from "./enum/recipesPerDay.js"
import { Allergen } from "./enum/allergen.js";
import { Diet } from "./enum/diet.js";
import { IngredientDocumentInterface } from "./ingredient.js";

/** Definición de la interfaz de documento de menu */
export interface MenuDocumentInterface extends Document {
  title: string;
  numberDays: number;
  numberServices: number;
  recipesPerDay: RecipesPerDay[];
  caloriesTarget: number;
  allergies: Allergen[];
  diet: Diet;
  excludedIngredients: IngredientDocumentInterface[]; 
  avergageEstimatedCost: number;
  ownerUser: UserDocumentInterface;
}

/** Definición del esquema de Mongoose para la menu */
const MenuSchema = new Schema<MenuDocumentInterface>({
  title: {
    type: String,
    trim: true,
  },
  numberDays: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero de días no puede ser negativo");
      }
    },
  },
  numberServices: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero de servicios no puede ser negativo");
      }
    },
  },
  recipesPerDay: {
    type: [
      {
        recipeStarterID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Recipe",
        },
        recipeMainDishID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Recipe",
        },
        recipeDessertID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Recipe",
        },
        bread: {
          type: Boolean,
          required: true,
        }
      },
    ],
    required: true,
    _id: false,
  },
  caloriesTarget: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero de calorias no puede ser negativo");
      }
    },
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
  avergageEstimatedCost: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero coste medio no puede ser negativo");
      }
    },
  },
  ownerUser: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

export const Menu = model<MenuDocumentInterface>("Menu", MenuSchema);
