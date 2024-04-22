import { Document, Schema, model } from "mongoose";
import { FoodGroup } from "./enum/foodGroup.js";
import { Allergen } from "./enum/allergen.js";
import { UserDocumentInterface } from "./user.js";
import {
  Nutrient,
  NutrientsTypes,
  getUnitFromName,
  mandatoryNutrients,
} from "./enum/nutrients.js";


/** Definición de la interfaz de documento de ingrediente */
export interface IngredientDocumentInterface extends Document {
  name : string;
  amount: number;
  unit: string;
  estimatedCost: number;
  foodGroup: FoodGroup;
  allergens: Allergen[];
  nutrients: Nutrient[];
  ownerUser: UserDocumentInterface;
}

/** Definición del esquema de Mongoose para el ingrediente */
const IngredientSchema = new Schema<IngredientDocumentInterface>({
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (value != value.toLowerCase()) {
        throw new Error("El nombre debe ser introducido en minusculas");
      }
    },
  },
  amount: {
    type: Number,
    default: 100,
  },
  unit: {
    type: String,
    trim: true,
    default: "gr",
  },
  estimatedCost: {
    type: Number,
    required: true,
    trim: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El coste no puede ser negativo");
      }
    },
  },
  foodGroup: {
    type: String,
    trim: true,
    required: true,
    enum: Object.values(FoodGroup),
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
        },
        unit: {
          type: String,
          default: function (this: { name: NutrientsTypes }) {
            return getUnitFromName(this.name);
          },
        },
      },
    ],
    validate: {
      validator: mandatoryNutrients, 
      message: "Debe contener los nutrientes obligados: Energía, Proteinas, Carbohidratos, Grasas Totales, Grasas Saturadas, Sal y Azúcares"
    },
    _id: false,
  },
  ownerUser: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

export const Ingredient = model<IngredientDocumentInterface>(
  "Ingredient",
  IngredientSchema,
);
