import 'mocha'
import request from "supertest";
import { app } from "../../src/app.js";
import { Ingredient } from "../../src/models/ingredient.js";
import { GrupoAlimenticio } from "../../src/models/enum/grupoAlimenticio.js"
import { Alergeno } from '../../src/models/enum/alergeno.js';
import { NutrientesTipos } from '../../src/models/enum/nutrientes.js';
import { IncompatibilidadAlimenticia } from '../../src/models/enum/incompatibilidadAlimenticia.js';

beforeEach(async () => {
  await Ingredient.deleteMany();
});

describe("Modelo Ingredient", () => {
  it("Debe recibir un error porque el ID es obligatorio", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el nombre es obligatorio", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el costeEstimado es obligatorio", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        grupoAlimenticio: GrupoAlimenticio.Frutas
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el costeEstimado debe ser mayor que 0", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: -1.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el grupoAlimenticio es obligatorio", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el grupoAlimenticio no existe en el enum", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: "Aceites y frutas"
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque el alergeno no existe en el enum", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas,
        alergenos: [ "Fruta" ]
      })
      .expect(500);
  }); 

  it("Debe recibir un error porque la incompatibilidad no existe en el enum", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas,
        alergenos: Alergeno.Leche,
        incompatibilidadesAlimenticias: [ "Celi-Vegetariano" ]
      })
      .expect(500);
  });

  it("Debe recibir un error porque el nutriente no existe en el enum", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas,
        alergenos: Alergeno.Leche,
        incompatibilidadesAlimenticias: [ IncompatibilidadAlimenticia.Celiacos ],
        nutrientes: [
          {
            nombre: "vitamina H",
            cantidad: 56,
          }
        ]
      })
      .expect(500);
  });

  it("Debe recibir un error porque la cantidad del nutriente es obligatoria", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas,
        alergenos: Alergeno.Leche,
        incompatibilidadesAlimenticias: [ IncompatibilidadAlimenticia.Celiacos ],
        nutrientes: [
          {
            nombre: NutrientesTipos.Energia,
          }
        ]
      })
      .expect(500);
  });


  it("Debe CREAR el objeto, todo correcto", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        nombre: "platano",
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: GrupoAlimenticio.Frutas,
        alergenos: Alergeno.Leche,
        incompatibilidadesAlimenticias: [ IncompatibilidadAlimenticia.Celiacos ],
        nutrientes: [
          {
            nombre: NutrientesTipos.Energia,
            cantidad: 56,
          }
        ]
      })
      .expect(201);
  });
});