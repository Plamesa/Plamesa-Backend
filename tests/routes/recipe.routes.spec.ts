import 'mocha';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { User } from '../../src/models/user.js';
import { Ingredient } from '../../src/models/ingredient.js';
import { Recipe } from '../../src/models/recipe.js';
import { Allergen } from '../../src/models/enum/allergen.js';
import { FoodType } from '../../src/models/enum/FoodType.js';
import { NutrientsTypes } from '../../src/models/enum/nutrients.js';
import { FoodGroup } from '../../src/models/enum/foodGroup.js';
import { Role } from '../../src/models/enum/role.js';

describe('Recipe Router', () => {
  let token: string;
  let userId: string;
  let createdIngredientId: string;
  let createdRecipeId: string;

  beforeEach(async () => {
    await User.deleteMany();
    await Ingredient.deleteMany();
    await Recipe.deleteMany();

    // Crear un usuario de prueba
    const user = new User({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular
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
  });

  it('Debería crear una receta exitosamente', async () => {
    const response = await request(app)
      .post('/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Receta Test',
        numberService: 4,
        preparationTime: 45,
        foodType: FoodType.Entrante,
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('_id');
    createdRecipeId = response.body._id;
  });

  it('Debería devolver un error si no hay token', async () => {
    const response = await request(app)
      .post('/recipe')
      .send({
        name: 'Receta Test',
        numberService: 4,
        preparationTime: 45,
        foodType: FoodType.Entrante,
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      });

    expect(response.status).to.equal(401);
  });

  it('Debería devolver un error si el ingrediente no se encuentra', async () => {
    const response = await request(app)
      .post('/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Receta Test',
        numberService: 4,
        preparationTime: 45,
        foodType: FoodType.Entrante,
        instructions: ['Paso 1', 'Paso 2'],
        ingredients: [{ ingredientID: '605c72ef9e7a9f30d8a1e123', amount: 50 }],
      });

    expect(response.status).to.equal(404);
    expect(response.body).to.have.property('error').that.equals('Ingrediente no encontrado');
  });

  it('Debería obtener todas las recetas', async () => {
    await new Recipe({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      ownerUser: userId,
    }).save();

    const response = await request(app).get('/recipe');

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('array');
    expect(response.body.length).to.be.at.least(1);
  });

  it('Debería obtener una receta por ID', async () => {
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

    const response = await request(app).get(`/recipe/${createdRecipeId}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('_id').that.equals(createdRecipeId);
  });

  it('Debería devolver un error si la receta no se encuentra por ID', async () => {
    const response = await request(app).get('/recipe/invalidId');

    expect(response.status).to.equal(500);
  });

  it('Debería actualizar una receta por ID', async () => {
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

    const response = await request(app)
      .patch(`/recipe/${createdRecipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Receta Actualizada',
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('name').that.equals('receta actualizada');
  });

  it('Debería devolver un error si no está autorizado para actualizar', async () => {
    const anotherUser = new User({
      username: 'testUser2',
      name: 'Test User',
      password: 'Test1234',
      email: 'test2@example.com',
      role: Role.UsuarioRegular
    });
    await anotherUser.save();
    const anotherUserId = anotherUser._id.toString();

    const recipe = new Recipe({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      ownerUser: anotherUserId,
    });
    await recipe.save();
    createdRecipeId = recipe._id.toString();

    const response = await request(app)
      .patch(`/recipe/${createdRecipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Receta Actualizada',
      });

    expect(response.status).to.equal(401);
  });

  it('Debería eliminar una receta por ID', async () => {
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

    const response = await request(app)
      .delete(`/recipe/${createdRecipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
  });

  it('Debería devolver un error si no está autorizado para eliminar', async () => {
    const anotherUser = new User({
      username: 'testUser2',
      name: 'Test User',
      password: 'Test1234',
      email: 'test2@example.com',
      role: Role.UsuarioRegular
    });
    await anotherUser.save();
    const anotherUserId = anotherUser._id.toString();

    const recipe = new Recipe({
      name: 'Receta Test',
      numberService: 4,
      preparationTime: 45,
      foodType: FoodType.Entrante,
      instructions: ['Paso 1', 'Paso 2'],
      ingredients: [{ ingredientID: createdIngredientId, amount: 50 }],
      ownerUser: anotherUserId,
    });
    await recipe.save();
    createdRecipeId = recipe._id.toString();

    const response = await request(app)
      .delete(`/recipe/${createdRecipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(401);
  });
});
