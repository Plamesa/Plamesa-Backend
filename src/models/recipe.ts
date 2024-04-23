import { Document, Schema, model } from "mongoose";
import { FoodType } from "./enum/FoodType.js";
import { IngredientDocumentInterface } from "./ingredient.js";
import { Allergen } from "./enum/allergen.js";
import {
  Nutrient,
  NutrientsTypes,
} from "./enum/nutrients.js";
import { UserDocumentInterface } from "./user.js";
import { IngredientRecipe } from "./enum/ingredientRecipe.js";

/** Definición de la interfaz de documento de receta */
export interface RecipeDocumentInterface extends Document {
  name: string;
  numberService: number;
  preparationTime: number;
  foodType: FoodType;
  instructions: string[];
  comments: string;
  cookware: string[];
  ingredients: IngredientRecipe[];
  estimatedCost: number;
  allergens: Allergen[];
  nutrients: Nutrient[];
  ownerUser: UserDocumentInterface;
}

/** Definición del esquema de Mongoose para la receta */
const RecipeSchema = new Schema<RecipeDocumentInterface>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  numberService: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero de servicios no puede ser negativo");
      }
    },
  },
  preparationTime: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El tiempo de preparacion no puede ser negativo");
      }
    },
  },
  foodType: {
    type: String,
    trim: true,
    required: true,
    enum: Object.values(FoodType),
  },
  instructions: {
    type: [String],
    required: true,
    trim: true,
  },
  comments: {
    type: String,
    trim: true,
  },
  cookware: {
    type: [String],
    trim: true,
  },
  ingredients: {
    type: [
      {
        ingredientID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Ingredient",
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    required: true,
    _id: false,
  },
  estimatedCost: {
    type: Number,
  },
  allergens: {
    type: [String],
    enum: Object.values(Allergen),
    trim: true,
  },
  nutrients: {
    type: [
      {
        name: {
          type: String,
          enum: Object.values(NutrientsTypes),
          trim: true,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        }
      },
    ],
    _id: false,
  },
  ownerUser: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

export const Recipe = model<RecipeDocumentInterface>("Recipe", RecipeSchema);
