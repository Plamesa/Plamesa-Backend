import 'mocha';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { User } from '../../src/models/user.js';
import { Ingredient } from '../../src/models/ingredient.js';
import { Recipe } from '../../src/models/recipe.js';
import { Menu } from '../../src/models/menu.js';
import { Role } from '../../src/models/enum/role.js';

describe('User Router', () => {
  let token: string;
  let userId: string;
  let adminToken: string;
  let adminId: string;

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

    // Crear un usuario admin de prueba
    const admin = new User({
      username: 'adminUser',
      name: 'Admin User',
      password: 'Admin1234',
      email: 'admin@example.com',
      role: Role.Admin,
    });
    admin.password = await bcrypt.hash(admin.password, saltRounds);
    await admin.save();

    adminId = admin._id.toString();

    const adminLoginResponse = await request(app)
      .post('/login')
      .send({
        username: 'adminUser',
        password: 'Admin1234',
      });

    adminToken = adminLoginResponse.body.token;
  });

  it('Debería crear un usuario exitosamente', async () => {
    const response = await request(app)
      .post('/user')
      .send({
        username: 'newUser',
        name: 'New User',
        password: 'New1234',
        email: 'new@example.com',
        role: 'Usuario regular',
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('_id');
    expect(response.body).to.have.property('username', 'newUser');
  });

  it('Debería obtener todos los usuarios con rol de admin', async () => {
    const response = await request(app)
      .get('/user/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('array');
    expect(response.body.length).to.be.at.least(1);
  });

  /*it('Debería devolver un error al obtener todos los usuarios sin rol de admin', async () => {
    const response = await request(app)
      .get('/user/all')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('error').that.equals('No autorizado para ver todos los usuarios');
  });*/

  it('Debería obtener un usuario por el token', async () => {
    const response = await request(app)
      .get('/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('_id').that.equals(userId);
  });

  it('Debería devolver un error si no hay token al obtener un usuario', async () => {
    const response = await request(app).get('/user');

    expect(response.status).to.equal(401);
  });

  it('Debería actualizar un usuario por el token', async () => {
    const response = await request(app)
      .patch('/user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated User',
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('name', 'Updated User');
  });

  it('Debería devolver un error al actualizar un usuario sin token', async () => {
    const response = await request(app)
      .patch('/user')
      .send({
        name: 'Updated User',
      });

    expect(response.status).to.equal(401);
  });

  it('Debería eliminar un usuario por el token', async () => {
    const response = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('_id').that.equals(userId);
  });

  it('Debería devolver un error al eliminar un usuario sin token', async () => {
    const response = await request(app).delete('/user');

    expect(response.status).to.equal(401);
  });
});