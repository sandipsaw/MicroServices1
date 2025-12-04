const request = require('supertest');
const fs = require('fs');
const path = require('path');

// mock imagekit module to avoid network calls
jest.mock('imagekit', () => {
  return jest.fn().mockImplementation(function () {
    // attach upload on this (as a class instance would have it)
    this.upload = jest.fn().mockResolvedValue({
      url: 'https://ik.test/demo.png',
      fileId: 'file_123',
      thumbnail: 'https://ik.test/demo_thumb.png',
    });
  });
});

// mock model
jest.mock('../Src/model/product.model', () => ({
  create: jest.fn().mockImplementation((payload) => Promise.resolve({ _id: 'testid', ...payload })),
}));

const app = require('../Src/app');
const ImageKit = require('imagekit');
const productModel = require('../Src/model/product.model');

describe('POST /api/product', () => {
  it('should upload image via ImageKit and save product', async () => {
    // prepare a small Buffer as file
    const testImagePath = path.join(__dirname, 'fixtures', 'test.png');

    const res = await request(app)
      .post('/api/product')
      .field('title', 'Test Product')
      .field('description', 'A nice item')
      .field('price', '99')
      .field('currency', 'USD')
      .field('seller', '60f8c9b8e1d3a4b5c6d7e8f9')
      .attach('image', testImagePath)

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Product');

    // ImageKit upload should be called
    // The mocked constructor should have been called and an instance created with upload function
    expect(ImageKit.mock).toBeDefined();
    expect(ImageKit.mock.instances.length).toBeGreaterThan(0);
    const instance = ImageKit.mock.instances[0];
    // debug: dump instance
    expect(typeof instance.upload).toBe('function');
    // debug logs removed
    // Check that ImageKit.upload was called with base64 file string and name
    const callArg = instance.upload.mock.calls[0][0];
    expect(callArg.fileName).toBe('test.png');
    // base64 of 'hello world'
    expect(callArg.file).toBe('aGVsbG8gd29ybGQ=');
    expect(instance.upload).toHaveBeenCalled();

    // productModel.create should be called with the values
    expect(productModel.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Product',
      description: 'A nice item',
      price: { amount: '99', currency: 'USD' },
      seller: '60f8c9b8e1d3a4b5c6d7e8f9',
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create product without file', async () => {
    const res = await request(app)
      .post('/api/product')
      .field('title', 'Test Product')
      .field('description', 'A nice item')
      .field('price', '99')
      .field('currency', 'USD')
      .field('seller', '60f8c9b8e1d3a4b5c6d7e8f9');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(productModel.create).toHaveBeenCalled();
    expect(productModel.create.mock.calls[0][0].image || []).toEqual([]);
    // ImageKit.upload should not be called in this case
    const i = ImageKit.mock.instances[0];
    if (i) {
      expect(i.upload).not.toHaveBeenCalled();
    }
  });
});
