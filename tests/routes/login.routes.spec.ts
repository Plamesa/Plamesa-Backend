import 'mocha';
import request from 'supertest';
import bcrypt from "bcryptjs";
import { expect } from 'chai';
import { User } from '../../src/models/user.js';
import { app } from '../../src/app.js';


describe('Login Router', () => {
  beforeEach(async () => {
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
  });

  it('Debería iniciar sesión exitosamente y devolver un token', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'testUser',
        password: 'Test1234',
      });
    
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
  });

  it('Debería devolver un error si el usuario no se encuentra', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'nonExistentUser',
        password: 'Test1234',
      });

    expect(response.status).to.equal(404);
    expect(response.body).to.have.property('error').that.equals('Usuario no encontrado');
  });

  it('Debería devolver un error si la contraseña es incorrecta', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'testUser',
        password: 'wrongPassword',
      });

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('message').that.equals('Credenciales inválidas');
  });
});
