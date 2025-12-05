const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// mock imagekit upload service so 'uuid' ESM import won't break tests
jest.mock('../Src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ filename }) => ({
    url: `https://ik.mock/${filename}`,
    thumbnail: `https://ik.mock/thumb/${filename}`,
    id: `file_${filename}`,
  })),
}));

const productModel = require('../Src/model/product.model');

const app = require('../Src/app');

describe('GET /api/product', () => {
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

  test('returns empty array when no products', async () => {
    const res = await request(app).get('/api/product').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('returns products when present and supports filters', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const p1 = await productModel.create({
      title: 'Apple iPhone',
      description: 'Phone',
      price: { amount: 1000, currency: 'USD' },
      image: [],
      seller: sellerId
    });
    const p2 = await productModel.create({
      title: 'Samsung Galaxy',
      description: 'Android phone',
      price: { amount: 500, currency: 'USD' },
      image: [],
      seller: sellerId
    });

    // fetch all
    let res = await request(app).get('/api/product').expect(200);
    expect(res.body.data.length).toBe(2);

    // query text search (q) should match title or description
    res = await request(app).get('/api/product').query({ q: 'iPhone' }).expect(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Apple iPhone');

    // minPrice filter
    res = await request(app).get('/api/product').query({ minPrice: 600 }).expect(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Apple iPhone');

    // maxPrice filter
    res = await request(app).get('/api/product').query({ maxPrice: 600 }).expect(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Samsung Galaxy');

    // pagination limit/skip
    res = await request(app).get('/api/product').query({ limit: 1 }).expect(200);
    expect(res.body.data.length).toBe(1);

    res = await request(app).get('/api/product').query({ limit: 1, skip: 1 }).expect(200);
    expect(res.body.data.length).toBe(1);
  });
});
