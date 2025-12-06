const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productModel = require('../Src/model/product.model');
const app = require('../Src/app');

// Mock imagekit to avoid ESM parse issues (not used directly in PATCH but consistent with other tests)
jest.mock('../Src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ filename }) => ({
    url: `https://ik.mock/${filename}`,
    thumbnail: `https://ik.mock/thumb/${filename}`,
    id: `file_${filename}`,
  })),
}));

describe('PATCH /api/product/:id', () => {
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

  test('allows seller to update own product fields', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'Old Title',
      description: 'desc',
      price: { amount: 100, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);
    const res = await request(app)
      .patch(`/api/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Title', price: { amount: 150 } })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data.title).toBe('New Title');
    expect(res.body.data.price.amount).toBe(150);
  });

  test('forbids non-owner seller from updating product', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: 'Old Title',
      description: 'desc',
      price: { amount: 100, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    const token = jwt.sign({ id: otherSellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);
    await request(app)
      .patch(`/api/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope' })
      .expect(403);
  });

  test('returns 400 for invalid id', async () => {
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' }, process.env.JWT_SECRET);
    await request(app)
      .patch('/api/product/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope' })
      .expect(400);
  });
});
