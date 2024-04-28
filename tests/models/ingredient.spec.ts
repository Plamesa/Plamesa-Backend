import 'mocha';
import request from 'supertest';
import { app } from '../../src/app.js';
import { Ingredient } from '../../src/models/ingredient.js';
import { User } from '../../src/models/user.js';
import { FoodGroup } from '../../src/models/enum/foodGroup.js';
import { NutrientsTypes } from '../../src/models/enum/nutrients.js';

let tokenModel: string;

beforeEach(async () => {
  await Ingredient.deleteMany();
  await User.deleteMany();

  const user = new User({
    username: 'testUserModel',
    name: 'Test User',
    password: 'Test1234',
    email: 'testModel.user@example.com',
    role: 'Usuario regular',
  });

  await user.save();

  const loginResponse = await request(app)
    .post('/login')
    .send({
      username: 'testUserModel',
      password: 'Test1234',
    });

    tokenModel = loginResponse.body.token;
});

describe('Modelo Ingredient', () => {
  it('Debe recibir un error, el nombre es obligatorio', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        amount: 100,
        unit: 'gr',
        estimatedCost: 5.2,
        foodGroup: FoodGroup.Frutas,
      })
      .expect(500);
  });

  it('Debe recibir un error, el estimatedCost es obligatorio', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        amount: 100,
        unit: 'gr',
        foodGroup: FoodGroup.Frutas,
      })
      .expect(500);
  });

  it('Debe recibir un error, el estimatedCost es negativo', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        amount: 100,
        unit: 'gr',
        estimatedCost: -5.2,
        foodGroup: FoodGroup.Frutas,
      })
      .expect(500);
  });

  it('Debe recibir un error, el foodGroup no está en el enum', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        estimatedCost: 5.2,
        foodGroup: 'InvalidGroup', // Grupo alimenticio no válido
      })
      .expect(500); // Debe fallar porque el grupo alimenticio es incorrecto
  });

  it('Debe recibir un error, un alérgeno no está en el enum', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        estimatedCost: 5.2,
        foodGroup: FoodGroup.Frutas,
        allergens: ['Chocolate'], // Alérgeno no válido
      })
      .expect(500);
  });

  it('Debe recibir un error, un nutriente no está en el enum', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        estimatedCost: 5.2,
        foodGroup: FoodGroup.Frutas,
        nutrients: [
          {
            name: 'Vitamina Z', // Nutriente no válido
            amount: 100,
          },
        ],
      })
      .expect(500);
  });

  it('Debe recibir un error, la cantidad de un nutriente es obligatoria', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`)
      .send({
        name: 'Platano',
        estimatedCost: 5.2,
        foodGroup: FoodGroup.Frutas,
        nutrients: [
          {
            name: NutrientsTypes.Energia, // Falta la cantidad
          },
        ],
      })
      .expect(500);
  });

  it('Debe fallar si faltan nutrientes obligatorios', async () => {
    await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`) // Usar el token
      .send({
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
          // No contiene todos los nutrientes obligatorios
        ],
      })
      .expect(500)
  });

  /*it('Debe crear un ingrediente correctamente con todos los nutrientes obligatorios', async () => {
    const response = await request(app)
      .post('/ingredient')
      .set('Authorization', `Bearer ${tokenModel}`) // Usar el token
      .send({
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
        ],
      })
      .expect(201); // Debe crear correctamente con todos los nutrientes obligatorios
  });*/
});
