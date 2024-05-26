import 'mocha';
import request from 'supertest';
import bcrypt from "bcryptjs";
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { User } from '../../src/models/user.js';
import { Role } from '../../src/models/enum/role.js';
import { Allergen } from '../../src/models/enum/allergen.js';


describe('Modelo de Menu', () => {
  beforeEach(async () => {
    await User.deleteMany();
  });


  it('Debería fallar al crear una receta sin username', async () => {
    await request(app)
    .post('/user')
    .send({
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta sin name', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta sin password', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      email: 'test@example.com',
      role: Role.UsuarioRegular
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta si el email no tiene un formato correcto', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'testcorreo',
      role: Role.UsuarioRegular
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta sin role', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
    })
    .expect(500);
  });

  it('Debería fallar al crear una receta con un role invalido del enum', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: 'Invalidrole'
    })
    .expect(500);
  });

  it('Debe fallar si la alergia no existe en el enum', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      allergies: ['Invalid Allergies']
    })
    .expect(500);
  });

  it('Debe fallar si la dieta no existe en el enum', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      diet: 'Invalid Diet'
    })
    .expect(500);
  });

  it('Debe fallar si el genero no existe en el enum', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      gender: 'Invalid Genero'
    })
    .expect(500);
  });

  it('Debe fallar si el weight es negativo', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      weight: -30
    })
    .expect(500);
  });

  it('Debe fallar si el height es negativo', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      height: -30
    })
    .expect(500);
  });

  it('Debe fallar si el age es negativo', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      age: -30
    })
    .expect(500);
  });

  it('Debe fallar si el activityLevel no existe en el enum', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      activityLevel: 'Invalid Actividad'
    })
    .expect(500);
  });

  it('Debe crear un usuario correctamente con los datos minimos', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular
    })
    .expect(201);
  });

  it('Debe crear un usuario correctamente', async () => {
    await request(app)
    .post('/user')
    .send({
      username: 'testUser',
      name: 'Test User',
      password: 'Test1234',
      email: 'test@example.com',
      role: Role.UsuarioRegular,
      allergies: [Allergen.Altramuces]
    })
    .expect(201);
  });
});
