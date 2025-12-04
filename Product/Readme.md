# Product service

### GET /products -> catalog listing with search(text index), filter (category,price range), pagination, sort.
---
### GET /products/:id -> product details, images, seller info(via populate), cacheable by id.
---
### POST /products (SELLER) -> create product, validate title,prices; seeds base varient if none. Emits products.created 
---
### PATCH /products/:id (SELLER) -> update product field; invalidate caches; emits products.updated
---
### DELETE /products/:id (SELLER) -> soft delete(status = archived) or hard delete if no orders. emits products.deleted 
---
### GET /products/seller (SELLER) -> seller product with stock status and sale metrices (aggregatio + cache);

## Testing

This project uses Jest and Supertest for testing. The POST /api/product endpoint includes file uploads via multer and ImageKit handling. Tests mock ImageKit and the product model to avoid network and DB calls.

Run tests:
```bash
npm install
npm test
```

Notes:
- The ImageKit integration is mocked in `test/post.product.test.js` — if you want to test with a real ImageKit instance, set the environment variables `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT` and remove the jest mock.
- To run individual tests: `npx jest test/post.product.test.js -i`.

