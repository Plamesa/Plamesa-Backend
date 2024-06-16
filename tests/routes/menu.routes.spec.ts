import 'mocha';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { app } from '../../src/app.js'; // Asegúrate de que la ruta al archivo app.js sea correcta
import { User } from '../../src/models/user.js';
import { Ingredient } from '../../src/models/ingredient.js';
import { Recipe } from '../../src/models/recipe.js';
import { Menu } from '../../src/models/menu.js';
import { Allergen } from '../../src/models/enum/allergen.js';
import { FoodType } from '../../src/models/enum/FoodType.js';
import { NutrientsTypes } from '../../src/models/enum/nutrients.js';
import { FoodGroup } from '../../src/models/enum/foodGroup.js';
import { Diet } from '../../src/models/enum/diet.js';

describe('Menu Router', () => {
  let token: string;
  let userId: string;
  let createdIngredientId: string;
  let createdRecipeId: string;
  let createdMenuId: string;

  beforeEach(async () => {
    await User.deleteMany();
    await Ingredient.deleteMany();
    await Recipe.deleteMany();
    await Menu.deleteMany();

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

    userId = user._id.toString();

    const loginResponse = await request(app)
      .post('/login')
      .send({
        username: 'testUser',
        password: 'Test1234',
      });

    token = loginResponse.body.token;

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

    // Crear una receta de prueba
    const recipe = new Recipe({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      ownerUser: userId,
    });

    await recipe.save();
    createdRecipeId = recipe._id.toString();
  });


  it('Debería crear un menú exitosamente', async () => {
    const response = await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${token}`)
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
      });
    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('_id');
  });

  it('Debería devolver un error si no hay token', async () => {
    const response = await request(app)
      .post('/menu')
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
      });

    expect(response.status).to.equal(401);
  });

  it('Debería devolver un error si la receta no se encuentra', async () => {
    const response = await request(app)
      .post('/menu')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numberDays: 1,
        numberServices: 3,
        recipesPerDay: [
          {
            recipeStarterID: '605c72ef9e7a9f30d8a1e123',
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
      });

    expect(response.status).to.equal(404);
  });

  it('Debería obtener un menú por ID', async () => {
    const menu = new Menu({
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
      ownerUser: userId
    });
    await menu.save();
    createdMenuId = menu._id.toString();

    const response = await request(app).get(`/menu/${createdMenuId}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('_id').that.equals(createdMenuId);
  });

  it('Debería devolver un error si el menú no se encuentra por ID', async () => {
    const response = await request(app).get('/menu/605c72ef9e7a9f30d8a1e123').set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(404);
  });

  it('Debería actualizar un menú por ID', async () => {
    const menu = new Menu({
      title: 'Titulo',
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
      ownerUser: userId
    });
    await menu.save();
    createdMenuId = menu._id.toString();

    const response = await request(app)
      .patch(`/menu/${createdMenuId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Titulo Cambiado',
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('title').that.equals('Titulo Cambiado');
  });

  it('Debería devolver un error si no está autorizado para actualizar', async () => {
    const anotherUser = new User({
      username: 'anotherUser',
      name: 'Another User',
      password: 'Another1234',
      email: 'another@example.com',
      role: 'Usuario regular'
    });
    await anotherUser.save();

    const menu = new Menu({
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
      ownerUser: anotherUser._id.toString(),
    });
    await menu.save();
    createdMenuId = menu._id.toString();

    const response = await request(app)
      .patch(`/menu/${createdMenuId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Menú No Autorizado',
      });

    expect(response.status).to.equal(401);
  });

  it('Debería eliminar un menú por ID', async () => {
    const menu = new Menu({
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
      ownerUser: userId
    });
    await menu.save();
    createdMenuId = menu._id.toString();

    const response = await request(app)
      .delete(`/menu/${createdMenuId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('_id').that.equals(createdMenuId);
  });

  it('Debería devolver un error si no está autorizado para eliminar', async () => {
    const anotherUser = new User({
      username: 'anotherUser',
      name: 'Another User',
      password: 'Another1234',
      email: 'another@example.com',
      role: 'Usuario regular'
    });
    await anotherUser.save();

    const menu = new Menu({
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
      ownerUser: anotherUser._id.toString(),
    });
    await menu.save();
    createdMenuId = menu._id.toString();

    const response = await request(app)
      .delete(`/menu/${createdMenuId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(401);
  });
});
