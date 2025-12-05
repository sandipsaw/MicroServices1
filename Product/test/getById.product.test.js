const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// Mock imagekit/service to avoid ESM issues during Jest runs (uuid ESM)
jest.mock('../Src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ filename }) => ({
    url: `https://ik.mock/${filename}`,
    thumbnail: `https://ik.mock/thumb/${filename}`,
    id: `file_${filename}`,
  })),
}));

const productModel = require('../Src/model/product.model');

const app = require('../Src/app');

describe('GET /api/product/:id', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongo) await mongo.stop();
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  test('returns product for valid id', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'OnePlus Nord',
      description: 'Nice phone',
      price: { amount: 399, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    const res = await request(app).get(`/api/product/${product._id}`).expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('OnePlus Nord');
  });

  test('returns 404 for non-existing id', async () => {
    const randomId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/product/${randomId}`).expect(404);
    expect(res.body.message).toMatch(/not found|not exists|not found/i);
  });

  test('returns 400 for invalid id format', async () => {
    const res = await request(app).get('/api/product/invalid-id').expect(400);
    expect(res.body.message).toBeDefined();
  });
});
