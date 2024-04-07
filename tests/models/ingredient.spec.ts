import 'mocha'
import request from "supertest";
import { app } from "../../src/app.js";
import { Ingredient } from "../../src/models/ingredient.js";

beforeEach(async () => {
  await Ingredient.deleteMany();
});

describe("Modelo Ingredient", () => {
  it("Debe recibir un error porque el nombre es obligatorio", async () => {
    await request(app)
      .post("/ingredient")
      .send({
        ID: 1,
        cantidad: 50,
        unidad: "gr",
        costeEstimado: 5.2,
        grupoAlimenticio: "Frutas y derivados"
      })
      .expect(500);
  }); 

  /*it("Debe recibir un error porque el nombre científico es obligatorio", async () => {
    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        description: "A fish for testing",
        image_url: "/fish/testus-fishus",
        minimum_size: 22,
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);
  });

  it("Debe recibir un error porque la descripción es obligatoria", async () => {
    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        cientific_name: "Testus Fishus",
        image_url: "/fish/testus-fishus",
        minimum_size: 22,
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);
  });

  it("Debe recibir un error porque la URL de la imagen es obligatoria", async () => {
    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        cientific_name: "Testus Fishus",
        description: "A fish for testing",
        minimum_size: 22,
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);
  });

  it("Debe recibir un error porque la talla mínima es obligatoria", async () => {
    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        cientific_name: "Testus Fishus",
        description: "A fish for testing",
        image_url: "/fish/testus-fishus",
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);
  });

  it("Debe recibir un error porque el la talla mínima tiene un formato incorrecto", async () => {
    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        cientific_name: "Testus Fishus",
        description: "A fish for testing",
        image_url: "/fish/testus-fishus",
        minimum_size: 0,
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);

    await request(app)
      .post("/fishes")
      .send({
        name: "Test Fish",
        cientific_name: "Testus Fishus",
        description: "A fish for testing",
        image_url: "/fish/testus-fishus",
        minimum_size: -1,
        habitat: "Sea",
        recommended_bait: "Crab",
      })
      .expect(500);
  });*/
});