import { Document, Schema, model } from "mongoose";
import { TipoComida } from "./enum/tipoComida.js";
import { IngredientDocumentInterface } from "./ingredient.js";
import { Alergeno } from "./enum/alergeno.js";
import { IncompatibilidadAlimenticia } from "./enum/incompatibilidadAlimenticia.js";
import {
  Nutriente,
  NutrientesTipos,
  getUnitFromName,
} from "./enum/nutrientes.js";

/** Definición de la interfaz de documento de receta */
export interface RecipeDocumentInterface extends Document {
  ID: number;
  nombre: string;
  servicios: number;
  tiempoPreparacion: number;
  tipoComida: TipoComida;
  instrucciones: string[];
  comentarios: string;
  utensiliosCocina: string[];
  ingredientes: IngredientDocumentInterface[];
  //cantidad: number;
  costeEstimado: number;
  alergenos: Alergeno[];
  incompatibilidadesAlimenticias: IncompatibilidadAlimenticia[];
  nutrientes: Nutriente[];
}

/** Definición del esquema de Mongoose para la receta */
const RecipeSchema = new Schema<RecipeDocumentInterface>({
  ID: {
    type: Number,
    unique: true,
    required: true,
  },
  nombre: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  servicios: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El numero de servicios no puede ser negativo");
      }
    },
  },
  tiempoPreparacion: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El tiempo de preparacion no puede ser negativo");
      }
    },
  },
  tipoComida: {
    type: String,
    trim: true,
    required: true,
    enum: Object.values(TipoComida),
  },
  instrucciones: {
    type: [String],
    required: true,
    trim: true,
  },
  comentarios: {
    type: String,
    trim: true,
  },
  utensiliosCocina: {
    type: [String],
    trim: true,
  },
  ingredientes: {
    type: [
      {
        IdIngrediente: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Ingredient",
        },
        cantidad: {
          type: Number,
          required: true,
        },
        unidad: {
          type: String,
          trim: true,
        },
      },
    ],
    required: true,
    _id: false,
  },
  costeEstimado: {
    type: Number,
  },
  alergenos: {
    type: [String],
    enum: Object.values(Alergeno),
    trim: true,
  },
  incompatibilidadesAlimenticias: {
    type: [String],
    enum: Object.values(IncompatibilidadAlimenticia),
    trim: true,
  },
  nutrientes: {
    type: [
      {
        nombre: {
          type: String,
          enum: Object.values(NutrientesTipos),
          trim: true,
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
        },
        unidad: {
          type: String,
        },
      },
    ],
    _id: false,
  },
});

export const Recipe = model<RecipeDocumentInterface>("Recipe", RecipeSchema);
