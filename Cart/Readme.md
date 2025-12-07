# Cart microservice

This repository includes a Cart microservice with REST endpoints and tests.

To run tests locally (they use an in-memory MongoDB):

```bash
npm install
npm test
```

The tests use Jest, Supertest, and mongodb-memory-server to run a full suite of cart API tests.

### Cart Service
---
### GET /cart- fetch current cart(item,total) Recompute price from Product Service from to avoid tampering
---
### POST /cart/items - add {productId, qty} validate availablity, reserved soft stock optionally 
---
### PATCH /cart/items/:productId - change quantity, remove if qty <= 0, return recalculated total.
---
### DELETE /cart/item:productId - remove line.
---
### DELETE /cart - clear cart
---