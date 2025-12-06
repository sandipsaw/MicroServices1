const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productModel = require('../Src/model/product.model');
const app = require('../Src/app');

// Mock imagekit/service like other Product tests to avoid ESM issues
jest.mock('../Src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ filename }) => ({
    url: `https://ik.mock/${filename}`,
    thumbnail: `https://ik.mock/thumb/${filename}`,
    id: `file_${filename}`,
  })),
}));

describe('DELETE /api/product/:id', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
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

  test('seller can delete their own product', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'To be deleted',
      description: 'desc',
      price: { amount: 10, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);
    const res = await request(app)
      .delete(`/api/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Ensure response contains success flag or message (app may return data shape differently)
    expect(res.body).toBeDefined();

    // confirm deletion where GET returns 404
    await request(app).get(`/api/product/${product._id}`).expect(404);
  });

  test('forbids non-owner seller from deleting product', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'Not yours',
      description: 'desc',
      price: { amount: 10, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    const token = jwt.sign({ id: otherSellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);
    await request(app)
      .delete(`/api/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    // Product still exists
    await request(app).get(`/api/product/${product._id}`).expect(200);
  });

  test('returns 404 for non-existent id', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);

    const randomId = new mongoose.Types.ObjectId();
    await request(app)
      .delete(`/api/product/${randomId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('returns 400 for invalid id format', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);

    await request(app)
      .delete(`/api/product/invalid-id`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  test('returns 401 when no auth token provided', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'No auth',
      description: 'desc',
      price: { amount: 10, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    await request(app)
      .delete(`/api/product/${product._id}`)
      .expect(401);
  });
});
