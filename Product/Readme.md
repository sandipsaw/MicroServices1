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
