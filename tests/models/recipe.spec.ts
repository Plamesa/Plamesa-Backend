import 'mocha';
import request from 'supertest';
import bcrypt from "bcryptjs";
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { FoodGroup } from '../../src/models/enum/foodGroup.js';
import { Ingredient } from '../../src/models/ingredient.js';
import { User } from '../../src/models/user.js';
import { Allergen } from '../../src/models/enum/allergen.js';
import { NutrientsTypes } from '../../src/models/enum/nutrients.js';
import { Recipe } from '../../src/models/recipe.js';
import { FoodType } from '../../src/models/enum/FoodType.js';

let tokenModelRecipe: string;
let createdIngredientId: string; // Almacena el ID del ingrediente creado
describe('Modelo de Receta', () => {
  beforeEach(async () => {
    await Ingredient.deleteMany();
    await Recipe.deleteMany();
    await User.deleteMany();

    // Crear un usuario de prueba
    const user = new User({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: 'Usuario regular'
    });
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);

    await user.save();

    const loginResponse = await request(app)
      .post('/login')
      .send({
        username: 'testUser',
        password: 'Test1234',
      });
  
    tokenModelRecipe = loginResponse.body.token; 

    // Crear un ingrediente de prueba
    const ingredient = new Ingredient({
      name: 'Test Ingredient',
      amount: 100,
      unit: 'gr',
      estimatedCost: 5,
      foodGroup: FoodGroup.Carnicos,
      allergens: [Allergen.CacahuetesFrutosSecos],
      nutrients: [
        { name: NutrientsTypes.Energia, amount: 100 },
        { name: NutrientsTypes.Proteinas, amount: 10 },
        { name: NutrientsTypes.Carbohidratos, amount: 100 },
        { name: NutrientsTypes.GrasaTotal, amount: 150 },
        { name: NutrientsTypes.GrasaSaturada, amount: 250 },
        { name: NutrientsTypes.Sal, amount: 58 },
        { name: NutrientsTypes.Azucar, amount: 159 },
      ],
      ownerUser: user,
    });

    await ingredient.save();
    createdIngredientId = ingredient._id.toString();
  });


  it('Debería fallar al crear una receta sin nombre', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta sin número de servicios', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      name: 'Test recipe',
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
    })
    .expect(500);
  });

  it('Debe recibir un error, el numberService es negativo', async () => {
    await request(app)
      .post('/recipe')
      .set('Authorization', `Bearer ${tokenModelRecipe}`)
      .send({
        name: 'Test recipe',
        numberService: -4,
        preparationTime: 45,
        foodType: FoodType.Entrante,
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      })
      .expect(500);
  });

  it('Debería fallar al crear una receta sin tiempo de preparación', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      name: 'Test recipe',
      numberService: 4,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
    })
    .expect(500);
  });

  it('Debe recibir un error, el preparationTime es negativo', async () => {
    await request(app)
      .post('/recipe')
      .set('Authorization', `Bearer ${tokenModelRecipe}`)
      .send({
        name: 'Test recipe',
        numberService: 4,
        preparationTime: -45,
        foodType: FoodType.Entrante,
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      })
      .expect(500);
  });

  it('Debería fallar al crear una receta sin tipo de comida', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      name: 'Test recipe',
      numberService: 4,
      preparationTime: 45,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
    })
    .expect(500);
  });

  it('Debe recibir un error, el foodType no está en el enum', async () => {
    await request(app)
      .post('/recipe')
      .set('Authorization', `Bearer ${tokenModelRecipe}`)
      .send({
        name: 'Test recipe',
        numberService: 4,
        preparationTime: 45,
        foodType: 'InvalidType',
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      })
      .expect(500);
  });

  it('Debería fallar al crear una receta sin ingredientes', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      name: 'Test recipe',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
    })
    .expect(500);
  });

  it('Debe crear una receta correctamente', async () => {
    await request(app)
    .post('/recipe')
    .set('Authorization', `Bearer ${tokenModelRecipe}`)
    .send({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
    })
    .expect(201);
  });
});
