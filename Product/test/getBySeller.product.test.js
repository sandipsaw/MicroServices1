const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
// mock imagekit upload service to avoid ESM/uuid issues consistent with other tests
jest.mock('../Src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ filename }) => ({
    url: `https://ik.mock/${filename}`,
    thumbnail: `https://ik.mock/thumb/${filename}`,
    id: `file_${filename}`,
  })),
}));

const productModel = require('../Src/model/product.model');
const app = require('../Src/app');

describe('GET /api/product/seller', () => {
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

  test('returns products belonging to the authenticated seller', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSellerId = new mongoose.Types.ObjectId();

    await productModel.create({
      title: 'Seller One Product A',
      description: 'A',
      price: { amount: 10, currency: 'USD' },
      image: [],
      seller: sellerId,
    });
    await productModel.create({
      title: 'Seller One Product B',
      description: 'B',
      price: { amount: 20, currency: 'USD' },
      image: [],
      seller: sellerId,
    });
    // not belonging to seller should not be returned
    await productModel.create({
      title: 'Other Seller Product',
      description: 'Other',
      price: { amount: 5, currency: 'USD' },
      image: [],
      seller: otherSellerId,
    });

    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .get('/api/product/seller')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    // verify every returned product belongs to the seller requesting
    expect(res.body.data.every(p => p.seller === sellerId.toHexString())).toBe(true);
  });

  test('returns empty data array when seller has no products', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSellerId = new mongoose.Types.ObjectId();

    // create products for other seller
    await productModel.create({
      title: 'Other Seller Product',
      description: 'Other',
      price: { amount: 5, currency: 'USD' },
      image: [],
      seller: otherSellerId,
    });

    const token = jwt.sign({ id: sellerId.toHexString(), role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .get('/api/product/seller')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('forbids access for non-seller roles', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    await productModel.create({
      title: 'Seller Product',
      description: 'X',
      price: { amount: 5, currency: 'USD' },
      image: [],
      seller: sellerId,
    });

    const token = jwt.sign({ id: sellerId.toHexString(), role: 'user' }, process.env.JWT_SECRET);

    await request(app)
      .get('/api/product/seller')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  test('returns 401 when no token is provided', async () => {
    await request(app)
      .get('/api/product/seller')
      .expect(401);
  });
});
