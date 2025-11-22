const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const connectToDb = require('../db/db');
const User = require('../Models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectToDb(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /auth/register', () => {
  test('should create a new user and not return password', async () => {
    const payload = {
      username: 'jdoe',
      email: 'jdoe@example.com',
      password: 'password123',
      fullname: { firstname: 'John', lastname: 'Doe' }
    };

    const res = await request(app)
      .post('/auth/register')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user).not.toHaveProperty('password');

    const userInDb = await User.findOne({ email: payload.email }).lean();
    expect(userInDb).toBeTruthy();
    expect(userInDb.username).toBe(payload.username);
    expect(userInDb.password).toBeTruthy();
    // password is hashed
    expect(userInDb.password).not.toBe(payload.password);
  });

  test('should return 400 when email is duplicate', async () => {
    const payload = {
      username: 'jdoe',
      email: 'jdoe@example.com',
      password: 'password123'
    };

    await request(app).post('/auth/register').send(payload).expect(201);

    const res = await request(app).post('/auth/register').send({ ...payload, username: 'jdoe2' }).expect(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/exists/);
  });

  test('should return 400 for missing required fields', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com' }).expect(400);
    expect(res.body.message).toMatch(/required/);
  });
});
