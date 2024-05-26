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
import { Menu } from '../../src/models/menu.js';
import { Diet } from '../../src/models/enum/diet.js';

let tokenModelMenu: string;
let createdIngredientId: string; // Almacena el ID del ingrediente creado
let createdRecipeId: string; // Almacena el ID del ingrediente creado
describe('Modelo de Menu', () => {
  beforeEach(async () => {
    await Ingredient.deleteMany();
    await Recipe.deleteMany();
    await Menu.deleteMany();
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
  
    tokenModelMenu = loginResponse.body.token; 

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

    const recipe = new Recipe({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      ownerUser: user,
    });

    await recipe.save();
    createdRecipeId = recipe._id.toString();
    
  });


  it('Debería fallar al crear una receta sin numberDays', async () => {
    await request(app)
    .post('/menu')
    .set('Authorization', `Bearer ${tokenModelMenu}`)
    .send({
      numberServices: 3,
      caloriesTarget: 2500,
      allergies: [Allergen.CacahuetesFrutosSecos],
      diet: Diet.Vegetarianos,
      excludedIngredients: [createdIngredientId],
      avergageEstimatedCost: 50,
    })
    .expect(500);
  });

  it('Debe recibir un error, el numberDays no coincide con la longitud de recipesPerDay', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 2,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: 50,
      })
      .expect(400);
  });

  it('Debería fallar al crear una receta sin numberServices', async () => {
    await request(app)
    .post('/menu')
    .set('Authorization', `Bearer ${tokenModelMenu}`)
    .send({
      numberDays: 1,
      recipesPerDay: [
        {
          recipeStarterID: createdRecipeId,
          recipeMainDishID: createdRecipeId,
          recipeDessertID: createdRecipeId,
          bread: true
        }
      ],
      caloriesTarget: 2500,
      allergies: [Allergen.CacahuetesFrutosSecos],
      diet: Diet.Vegetarianos,
      excludedIngredients: [createdIngredientId],
      avergageEstimatedCost: 50,
    })
    .expect(500);
  });

  it('Debe recibir un error, el numberService es negativo', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: -3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: 50,
      })
      .expect(500);
  });

  it('Debe recibir un error, el recipeDessertID no existe', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: '605c72ef9e7a9f30d8a1e123',
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: ['InvalidID'],
        avergageEstimatedCost: 50,
      })
      .expect(404);
  });

  it('Debería fallar al crear una receta sin caloriesTarget', async () => {
    await request(app)
    .post('/menu')
    .set('Authorization', `Bearer ${tokenModelMenu}`)
    .send({
      numberDays: 1,
      numberServices: 3,
      recipesPerDay: [
        {
          recipeStarterID: createdRecipeId,
          recipeMainDishID: createdRecipeId,
          recipeDessertID: createdRecipeId,
          bread: true
        }
      ],
      allergies: [Allergen.CacahuetesFrutosSecos],
      diet: Diet.Vegetarianos,
      excludedIngredients: [createdIngredientId],
      avergageEstimatedCost: 50,
    })
    .expect(500);
  });

  it('Debe recibir un error, el caloriesTarget es negativo', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: -2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: 50,
      })
      .expect(500);
  });

  it('Debe recibir un error, el allergies no está en el enum', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: ['InvalidAllergies'],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: 50,
      })
      .expect(500);
  });

  it('Debe recibir un error, el diet no está en el enum', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: 'InvalidDiet',
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: 50,
      })
      .expect(500);
  });

  it('Debe recibir un error, el excludedIngredients no existe', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: ['605c72ef9e7a9f30d8a1e123'],
        avergageEstimatedCost: 50,
      })
      .expect(404);
  });

  it('Debe recibir un error, el avergageEstimatedCost es requerido', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
      })
      .expect(500);
  });

  it('Debe recibir un error, el avergageEstimatedCost no puede ser negativo', async () => {
    await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${tokenModelMenu}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: createdRecipeId,
            recipeMainDishID: createdRecipeId,
            recipeDessertID: createdRecipeId,
            bread: true
          }
        ],
        caloriesTarget: 2500,
        allergies: [Allergen.CacahuetesFrutosSecos],
        diet: Diet.Vegetarianos,
        excludedIngredients: [createdIngredientId],
        avergageEstimatedCost: -50,
      })
      .expect(500);
  });


  it('Debe crear un menu correctamente', async () => {
    await request(app)
    .post('/menu')
    .set('Authorization', `Bearer ${tokenModelMenu}`)
    .send({
      numberDays: 1,
      numberServices: 3,
      recipesPerDay: [
        {
          recipeStarterID: createdRecipeId,
          recipeMainDishID: createdRecipeId,
          recipeDessertID: createdRecipeId,
          bread: true
        }
      ],
      caloriesTarget: 2500,
      allergies: [Allergen.CacahuetesFrutosSecos],
      diet: Diet.Vegetarianos,
      excludedIngredients: [createdIngredientId],
      avergageEstimatedCost: 50,
    })
    .expect(201);
  });
});
