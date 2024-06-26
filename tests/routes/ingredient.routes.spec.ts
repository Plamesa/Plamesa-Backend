import 'mocha';
import request from 'supertest';
import bcrypt from "bcryptjs";
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { Ingredient, IngredientDocumentInterface } from '../../src/models/ingredient.js';
import { User } from '../../src/models/user.js';
import { FoodGroup } from '../../src/models/enum/foodGroup.js';
import { Nutrient, NutrientsTypes } from '../../src/models/enum/nutrients.js';
import { ActivityLevel, Gender } from '../../src/models/enum/userData.js';
import { Role } from '../../src/models/enum/role.js';

let token: string;
let createdIngredientId: string; // Almacena el ID del ingrediente creado

const ingredientToCreate = {
  name: 'Platano',
  estimatedCost: 5.2,
  foodGroup: FoodGroup.Frutas,
  nutrients: [
    {
      name: NutrientsTypes.Energia,
      amount: 200,
    },
    {
      name: NutrientsTypes.Proteinas,
      amount: 50,
    },
    {
      name: NutrientsTypes.Carbohidratos,
      amount: 100,
    },
    {
      name: NutrientsTypes.GrasaTotal,
      amount: 150,
    },
    {
      name: NutrientsTypes.GrasaSaturada,
      amount: 250,
    },
    {
      name: NutrientsTypes.Sal,
      amount: 58,
    },
    {
      name: NutrientsTypes.Azucar,
      amount: 159,
    },
  ]
}

// Antes de cada prueba, crear un usuario y obtener un token
describe('Rutas de Ingredientes', () => {
  beforeEach(async () => {
    await Ingredient.deleteMany();
    await User.deleteMany();
  
    const user = new User({
      username: 'testUserRoutes',
      name: 'Test User',
      password: 'Test1234',
      email: 'testRoutes.user@example.com',
      role: Role.UsuarioRegular
    });
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  
    await user.save();
  
    const loginResponse = await request(app)
      .post('/login')
      .send({
        username: 'testUserRoutes',
        password: 'Test1234',
      });
  
    token = loginResponse.body.token; 
  
    const ingredient = new Ingredient({
      name: 'Platano Rojo',
      estimatedCost: 5.2,
      foodGroup: FoodGroup.Frutas,
      nutrients: [
        {
          name: NutrientsTypes.Energia,
          amount: 200,
        },
        {
          name: NutrientsTypes.Proteinas,
          amount: 50,
        },
        {
          name: NutrientsTypes.Carbohidratos,
          amount: 100,
        },
        {
          name: NutrientsTypes.GrasaTotal,
          amount: 150,
        },
        {
          name: NutrientsTypes.GrasaSaturada,
          amount: 250,
        },
        {
          name: NutrientsTypes.Sal,
          amount: 58,
        },
        {
          name: NutrientsTypes.Azucar,
          amount: 159,
        },
      ],
      ownerUser: user._id,
    });
  
    await ingredient.save(); 
    createdIngredientId = ingredient._id.toString();
  });


  it('Debe fallar al crear ingrediente si no se proporciona token', async () => {
    await request(app)
      .post('/ingredient')
      .send({
        name: 'Platano',
        estimatedCost: 5.2,
        foodGroup: FoodGroup.Frutas,
      })
      .expect(401); // Debe fallar por falta de autenticación
  });

  it('Debe crear un ingrediente con un token válido', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`) // Usar el token
      .send(ingredientToCreate)
      .expect(201); // Debe crear correctamente
  });

  it('Debe obtener todos los ingredientes', async () => {
    const response = await request(app)
      .get('/ingredient')
      .expect(200);

    expect(response.body.length).to.be.above(0);
  });

  it('Debe obtener un ingrediente por ID', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    await request(app)
      .get(`/ingredient/${ingredienteCreado.body._id}`)
      .expect(201)
      .expect((res) => {
        if (res.body.name !== 'platano') {
          throw new Error("El nombre del ingrediente no es correcto");
        }
      });
  });

  it('Debe fallar al obtener un ingrediente por ID inexistente', async () => {
    await request(app)
      .get('/ingredient/605c72ef9e7a9f30d8a1e123')
      .expect(404);
  });

  it('Debe actualizar un ingrediente con permisos correctos', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    const response = await request(app)
      .patch(`/ingredient/${ingredienteCreado.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Platano Actualizado',
      })
      .expect(201); // Debe actualizar con éxito

      expect(response.body).to.include({
        name: "platano actualizado"
      });
  });

  it('Debe actualizar un ingrediente con permisos correctos incluyendo nutrientes', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    const response = await request(app)
      .patch(`/ingredient/${ingredienteCreado.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Platano Actualizado',
        nutrients: [
          {
            name: NutrientsTypes.Energia,
            amount: 12
          },
          {
            name: NutrientsTypes.Proteinas,
            amount: 50,
          },
          {
            name: NutrientsTypes.Carbohidratos,
            amount: 100,
          },
          {
            name: NutrientsTypes.GrasaTotal,
            amount: 150,
          },
          {
            name: NutrientsTypes.GrasaSaturada,
            amount: 250,
          },
          {
            name: NutrientsTypes.Sal,
            amount: 58,
          },
          {
            name: NutrientsTypes.Azucar,
            amount: 159,
          }
        ]
      })
      .expect(201); // Debe actualizar con éxito

      expect(response.body).to.include({
        name: "platano actualizado"
      });

      const nutrientExists = response.body.nutrients.some(
        (nutrient: Nutrient) => 
          nutrient.name === NutrientsTypes.Energia && 
          nutrient.amount === 12 && 
          nutrient.unit === "kcal"
      );
      expect(nutrientExists).to.be.true;
  });

  it('Debe fallar al actualizar si no se proporciona token', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    await request(app)
      .patch(`/ingredient/${ingredienteCreado.body._id}`)
      .send({
        name: 'Platano Actualizado'
      })
      .expect(401); // Debe fallar por falta de autenticación
  });

  it('Debe eliminar un ingrediente correctamente', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    await request(app)
      .delete(`/ingredient/${ingredienteCreado.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200); // Debe eliminar con éxito
  });

  it('Debe fallar al eliminar un ingrediente inexistente', async () => {
    await request(app)
      .delete('/ingredient/605c72ef9e7a9f30d8a1e123') // ID inexistente
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('Debe fallar al eliminar un ingrediente si no se proporciona token', async () => {
    const ingredienteCreado = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send(ingredientToCreate)
      .expect(201);

    await request(app)
      .delete(`/ingredient/${ingredienteCreado.body._id}`)
      .expect(401);
  });

  it('Debe fallar al actualizar un ingrediente inexistente', async () => {
    await request(app)
      .patch('/ingredient/605c72ef9e7a9f30d8a1e123') 
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Platano Actualizado'
      })
      .expect(404);
  });

  it('Debe fallar al crear un ingrediente con datos incompletos', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Platano'
        // Falta estimatedCost y foodGroup
      })
      .expect(500);
  });

  it('Debe fallar al crear un ingrediente con un costo estimado negativo', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Platano',
        estimatedCost: -5.2, // Costo estimado negativo
        foodGroup: FoodGroup.Frutas,
      })
      .expect(500);
  });
});
