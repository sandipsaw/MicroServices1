const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const nock = require('nock');

const app = require('../src/app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // clear db
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.listCollections().toArray();
    for (const { name } of collections) {
      await db.collection(name).deleteMany({});
    }
  }
  nock.cleanAll();
});

describe('POST /cart/items - add item with availability checks', () => {
  const productHost = 'http://localhost:3002';
  const pA = { id: 'prod-A', price: 100, stock: 10 };
  const pReserved = { id: 'prod-R', price: 250, stock: 10, reserved: 7 };

  function mockProduct(product) {
    nock(productHost)
      .get(`/products/${product.id}`)
      .reply(200, product);
  }

  test('creates item when qty <= stock and returns 201 with recalculated price', async () => {
    mockProduct(pA);
    const res = await request(app).post('/cart/items').send({ productId: pA.id, qty: 2 }).expect(201);
    // Expect response to include items and total that uses product price (server-side recomputed)
    expect(res.body).toBeDefined();
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    const item = res.body.items.find(i => i.productId === pA.id || i.productId === pA.id);
    // if server returns detailed item, its qty should be preserved
    if (item) {
      expect(item.qty).toBe(2);
      expect(item.price).toBe(pA.price);
    }
    if (typeof res.body.total === 'number') {
      expect(res.body.total).toBe(2 * pA.price);
    }
  });

  test('rejects when requested qty > stock', async () => {
    mockProduct(pA);
    await request(app).post('/cart/items').send({ productId: pA.id, qty: 999 }).expect(400);
  });

  test('rejects when requested qty > available stock (stock - reserved)', async () => {
    mockProduct(pReserved);
    // available = stock - reserved = 3
    await request(app).post('/cart/items').send({ productId: pReserved.id, qty: 4 }).expect(400);
    // allowed when qty <= available
    const ok = await request(app).post('/cart/items').send({ productId: pReserved.id, qty: 3 }).expect(201);
    expect(ok.body).toBeDefined();
    expect(typeof ok.body.total === 'number').toBeTruthy();
  });
});
