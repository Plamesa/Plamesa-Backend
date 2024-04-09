import { Document, Schema, model } from "mongoose";
import { GrupoAlimenticio } from "./enum/grupoAlimenticio.js";
import { Alergeno } from "./enum/alergeno.js";
import { IncompatibilidadAlimenticia } from "./enum/incompatibilidadAlimenticia.js";
import {
  Nutriente,
  NutrientesTipos,
  getUnitFromName,
} from "./enum/nutrientes.js";

/** Definición de la interfaz de documento de ingrediente */
export interface IngredientDocumentInterface extends Document {
  ID: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  costeEstimado: number;
  grupoAlimenticio: GrupoAlimenticio;
  alergenos: Alergeno[];
  incompatibilidadesAlimenticias: IncompatibilidadAlimenticia[];
  nutrientes: Nutriente[];
}

/** Definición del esquema de Mongoose para el ingrediente */
const IngredientSchema = new Schema<IngredientDocumentInterface>({
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
  cantidad: {
    type: Number,
    default: 100,
  },
  unidad: {
    type: String,
    trim: true,
    default: "gr",
  },
  costeEstimado: {
    type: Number,
    required: true,
    trim: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error("El coste no puede ser negativo");
      }
    },
  },
  grupoAlimenticio: {
    type: String,
    trim: true,
    required: true,
    enum: Object.values(GrupoAlimenticio),
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
          default: function (this: { nombre: NutrientesTipos }) {
            return getUnitFromName(this.nombre);
          },
        },
      },
    ],
    _id: false,
  },
});

export const Ingredient = model<IngredientDocumentInterface>(
  "Ingredient",
  IngredientSchema,
);
