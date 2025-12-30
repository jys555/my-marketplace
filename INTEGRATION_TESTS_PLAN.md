# 🧪 Integration Tests - Implementation Plan

## 🎯 Maqsad

Route integration tests yaratish - API endpoint'larni test qilish (database bilan).

---

## 📋 Test Setup Requirements

### 1. Test Database Setup

**Muammo:**
- Real database'ga test data yozish yomon
- Real ma'lumotlar buzilishi mumkin

**Yechim:**
- Test database yaratish (alohida)
- Yoki test environment variable (TEST_DATABASE_URL)

---

### 2. Test Utilities

**Kerakli utilities:**
- Test database connection
- Test data setup/teardown
- Request helper (supertest)
- Cleanup functions

---

### 3. Test Structure

```
backend/
├── __tests__/
│   ├── setup.js              (Test database setup)
│   ├── helpers.js            (Test utilities)
│   └── routes/
│       ├── products.test.js  (Product routes tests)
│       ├── categories.test.js (Category routes tests)
│       └── orders.test.js    (Order routes tests)
```

---

## 🎯 Test Coverage Plan

### Priority 1: Critical Routes

1. **Products Routes** (Seller App)
   - GET `/api/seller/products`
   - POST `/api/seller/products`
   - PUT `/api/seller/products/:id`
   - DELETE `/api/seller/products/:id`

2. **Categories Routes** (Amazing Store)
   - GET `/api/categories`
   - POST `/api/categories`
   - PUT `/api/categories/:id`

3. **Orders Routes** (Amazing Store)
   - GET `/api/orders`
   - POST `/api/orders`

---

### Priority 2: Other Routes

4. **Banners Routes**
5. **Users Routes**
6. **Prices Routes**
7. **Inventory Routes**

---

## 🛠️ Implementation Steps

### Step 1: Test Setup

**Fayl:** `__tests__/setup.js`

**Features:**
- Test database connection
- Before all/after all hooks
- Database cleanup

---

### Step 2: Test Helpers

**Fayl:** `__tests__/helpers.js`

**Features:**
- Request helper (supertest)
- Test data factories
- Cleanup utilities

---

### Step 3: Route Tests

**Example:** `__tests__/routes/products.test.js`

**Test Cases:**
- GET products (success)
- GET products (pagination)
- POST product (success)
- POST product (validation error)
- PUT product (success)
- PUT product (not found)
- DELETE product (success)

---

## 📦 Required Packages

```bash
npm install --save-dev supertest
```

**supertest** - HTTP assertions library for testing Express routes

---

## 🎯 Test Examples

### Products Route Test:

```javascript
const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

describe('Products API', () => {
    beforeEach(async () => {
        // Clean up test data
        await db.query('TRUNCATE TABLE products CASCADE');
    });

    test('GET /api/seller/products returns products', async () => {
        // Setup test data
        await db.query('INSERT INTO products ...');
        
        const response = await request(app)
            .get('/api/seller/products')
            .set('Authorization', 'Bearer test-token')
            .expect(200);
        
        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
    });

    test('POST /api/seller/products creates product', async () => {
        const productData = {
            name_uz: 'Test Product',
            price: 100,
            ...
        };
        
        const response = await request(app)
            .post('/api/seller/products')
            .send(productData)
            .set('Authorization', 'Bearer test-token')
            .expect(201);
        
        expect(response.body).toHaveProperty('id');
        expect(response.body.name_uz).toBe('Test Product');
    });
});
```

---

## ⚠️ Challenges

### 1. Authentication

**Muammo:**
- Routes authentication talab qiladi
- Test'da real authentication yo'q

**Yechim:**
- Mock authentication middleware
- Test token generation
- Bypass authentication (test mode)

---

### 2. Database State

**Muammo:**
- Test'lar bir-biriga ta'sir qilishi mumkin
- Database state cleanup kerak

**Yechim:**
- `beforeEach` - cleanup before each test
- `afterEach` - cleanup after each test
- Transaction rollback (if possible)

---

### 3. Test Data

**Muammo:**
- Test data yaratish va tozalash

**Yechim:**
- Test data factories
- Helper functions
- Cleanup utilities

---

## 🎯 Implementation Order

1. ⏭️ supertest package qo'shish
2. ⏭️ Test setup (`__tests__/setup.js`)
3. ⏭️ Test helpers (`__tests__/helpers.js`)
4. ⏭️ First route test (products)
5. ⏭️ Other route tests

---

**Status:** ⏭️ Integration tests setup boshlanmoqda! 🚀
