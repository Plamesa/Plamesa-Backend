import { Document, Schema, model } from 'mongoose';
//import { UsuarioDocumentInterface } from './usuario.js';


export interface IngredientDocumentInterface extends Document {
  ID: number,
  nombre: string,
  cantidad: number,
  unidad: string,
  coste: number,
  //usuariosRealizaron: UsuarioDocumentInterface[],
}

const IngredientSchema = new Schema<IngredientDocumentInterface>({
  ID: {
    type: Number,
    unique: true,
    required: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    uniqued: true,
  },
  cantidad: {
    type: Number,
    required: true,
  },
  unidad: {
    type: String,
    required: true,
    trim: true,
  },
  coste: {
    type: Number,
    required: true,
    trim: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error('El coste no puede ser negativo');
      }
    },
  },
  /*longitud: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0) {
        throw new Error('La longitud no puede ser negativa');
      }
    },
  },*/
  /*usuariosRealizaron: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: 'Usuario',
  },*/
  /*tipoActividad: {
    type: String,
    trim: true,
    enum: ['bicicleta', 'correr'],
  },*/
});

export const Ingredient = model<IngredientDocumentInterface>('Ingredient', IngredientSchema);