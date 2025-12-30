# 🧪 Testing Infrastructure - Nima va Nega?

## ❓ Testing Nima?

**Testing** - Bu kodingizning to'g'ri ishlashini tekshirish uchun yozilgan kod.

**Misol:**
```javascript
// Sizning kodingiz:
function add(a, b) {
    return a + b;
}

// Test:
test('add function adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
});
```

Agar test muvaffaqiyatli bo'lsa - kod to'g'ri ishlayapti! ✅

---

## 🎯 Testing Nega Kerak?

### 1. **Xatoliklarni Tezda Topish** ⚡

**Muammo:**
- Kodingizda xatolik bor
- Uni production'da user topib bildiradi
- User tushunib qoldi!

**Hal qilish:**
- Test yozamiz
- Har bir o'zgarishdan keyin testlarni ishga tushiramiz
- Agar test fail bo'lsa - xatolikni oldindan ko'ramiz ✅

---

### 2. **Refactoring'ni Xavfsiz Qilish** 🔒

**Muammo:**
- Kodni yaxshilash kerak (refactoring)
- Lekin tushunish qiyin - nima buzilishi mumkin?
- Ko'p funksiyalar bir-biriga bog'liq

**Hal qilish:**
- Testlar bor bo'lsa, refactoring qilish xavfsiz
- Testlar muvaffaqiyatli bo'lsa - kod hali ham to'g'ri ishlayapti ✅

---

### 3. **Kodni Hujjatlashtirish** 📚

**Muammo:**
- Funksiya qanday ishlashini bilish qiyin
- Comment'lar eskirgan bo'lishi mumkin

**Hal qilish:**
- Testlar kodning qanday ishlashini ko'rsatadi
- Testlar = Yashirin hujjatlar ✅

---

### 4. **Confidence (Ishonch)** 💪

**Muammo:**
- Yangi kod qo'shishdan qo'rqasiz
- "Agar bu xatolik keltirsa-chi?"

**Hal qilish:**
- Testlar bor bo'lsa, yangi kod qo'shish oson
- Testlar muvaffaqiyatli bo'lsa - ishonchli! ✅

---

## 📋 Testing Turlari

### 1. **Unit Tests** (Funksiya/Birinchi Daraja)

**Nima:**
- Bitta funksiyani test qilish
- Boshqa funksiyalardan izolyatsiya qilingan

**Misol:**
```javascript
// Validation middleware test
test('validateRequired throws error if value is empty', () => {
    expect(() => validateRequired('', 'name')).toThrow('name is required');
    expect(() => validateRequired(null, 'name')).toThrow('name is required');
});
```

**Qayerda:**
- Validation utilities
- Helper functions
- Utility functions

---

### 2. **Integration Tests** (Birga Ishlash)

**Nima:**
- Bir nechta funksiyalar birga ishlashini test qilish
- Database, API bilan integratsiya

**Misol:**
```javascript
// Route test
test('POST /api/products creates product', async () => {
    const response = await request(app)
        .post('/api/products')
        .send({ name_uz: 'Test Product', price: 100 });
    
    expect(response.status).toBe(201);
    expect(response.body.name_uz).toBe('Test Product');
});
```

**Qayerda:**
- API routes
- Database queries
- Middleware chain

---

### 3. **E2E Tests** (End-to-End)

**Nima:**
- Butun tizimni test qilish (frontend → backend → database)
- Real browser'da

**Misol:**
```javascript
// E2E test (Playwright)
test('user can create product', async ({ page }) => {
    await page.goto('/catalog.html');
    await page.fill('#name_uz', 'Test Product');
    await page.fill('#price', '100');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();
});
```

**Qayerda:**
- Full user flows
- Frontend → Backend integration

---

## 🛠️ Testing Infrastructure Setup

### Jest - JavaScript Testing Framework

**Nima:**
- JavaScript uchun testing framework
- Facebook tomonidan yaratilgan
- Keng qo'llaniladi

**Qanday Ishlaydi:**

1. **Test fayl yaratish:**
   ```javascript
   // validation.test.js
   const { validateRequired } = require('./validation');
   
   describe('validateRequired', () => {
       test('throws error if value is empty', () => {
           expect(() => validateRequired('', 'name')).toThrow();
       });
       
       test('returns value if not empty', () => {
           expect(validateRequired('test', 'name')).toBe('test');
       });
   });
   ```

2. **Test ishga tushirish:**
   ```bash
   npm test
   # yoki
   npm run test
   ```

3. **Natija:**
   ```
   PASS  validation.test.js
     validateRequired
       ✓ throws error if value is empty
       ✓ returns value if not empty
   
   Test Suites: 1 passed, 1 total
   Tests:       2 passed, 2 total
   ```

---

## 📦 Setup Qadamlar

### 1. Jest Package Qo'shish

```bash
npm install --save-dev jest
```

---

### 2. package.json Setup

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ]
  }
}
```

---

### 3. Test Fayllar Tuzilishi

```
backend/
├── middleware/
│   ├── validate.js
│   └── validate.test.js      ← Test fayli
├── utils/
│   ├── errors.js
│   └── errors.test.js        ← Test fayli
└── routes/
    ├── products.js
    └── products.test.js      ← Test fayli
```

**Qoida:** Test fayl nomi: `originalFileName.test.js`

---

### 4. Test Database Setup

**Muammo:**
- Real database'ga test data yozish yomon
- Real ma'lumotlar buzilishi mumkin

**Hal qilish:**
- Test database yaratish (alohida)
- Yoki in-memory database (SQLite)

```javascript
// test-setup.js
const { Pool } = require('pg');

// Test database connection
const testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost/test_db'
});

// Test'dan oldin database'ni tozalash
beforeEach(async () => {
    await testPool.query('TRUNCATE TABLE products CASCADE');
});
```

---

## 🎯 Nimalarni Test Qilish Kerak?

### Priority 1: CRITICAL 🔴

1. **Validation Middleware** ✅
   - `validateRequired()` - Required validation
   - `validateString()` - String validation
   - `validateNumber()` - Number validation
   - `validatePositive()` - Positive number
   - `validateURL()` - URL validation

2. **Error Classes** ✅
   - `AppError` - Base error class
   - `ValidationError` - Validation errors
   - `NotFoundError` - Not found errors
   - `mapPostgresError()` - PostgreSQL error mapping

---

### Priority 2: IMPORTANT 🟠

3. **Error Handler Middleware** ✅
   - Error catching
   - Error response format
   - PostgreSQL error mapping

4. **Routes (Integration Tests)** ✅
   - GET routes (products, categories)
   - POST routes (create product)
   - PUT routes (update product)
   - Error handling

---

### Priority 3: NICE TO HAVE 🟡

5. **Cache Utilities** ✅
   - Cache get/set
   - Cache TTL
   - Cache invalidation

6. **API Helpers** ✅
   - Request helpers
   - Response helpers

---

## 📊 Test Coverage

**Coverage** - Qanday foiz kod test qilingan

**Misol:**
```
Test Coverage: 85%
- Statements: 85%
- Branches: 80%
- Functions: 90%
- Lines: 85%
```

**Maqsad:**
- Minimum: 70% coverage
- Yaxshi: 80%+ coverage
- Perfect: 90%+ coverage

---

## 🔄 CI/CD Integration

### GitHub Actions

**Nima:**
- Har bir commit'da testlar avtomatik ishga tushadi
- Agar test fail bo'lsa - merge qilish mumkin emas

**Misol:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

---

## 🎯 Testing Best Practices

### 1. **Arrange-Act-Assert Pattern**

```javascript
test('validatePositive accepts positive numbers', () => {
    // Arrange (Tayyorlash)
    const value = 10;
    const fieldName = 'price';
    
    // Act (Ishga tushirish)
    const result = validatePositive(value, fieldName);
    
    // Assert (Tekshirish)
    expect(result).toBe(10);
});
```

---

### 2. **Test Nomlari Aniq Bo'lishi Kerak**

```javascript
// ❌ Yomon:
test('test1', () => { ... });
test('works', () => { ... });

// ✅ Yaxshi:
test('validateRequired throws error if value is empty', () => { ... });
test('validatePositive accepts positive numbers', () => { ... });
test('POST /api/products returns 400 if name_uz is missing', () => { ... });
```

---

### 3. **Har Bir Test Mustaqil Bo'lishi Kerak**

```javascript
// ❌ Yomon (bir test boshqa test'ga bog'liq):
let counter = 0;
test('increment counter', () => {
    counter++;
    expect(counter).toBe(1);
});
test('counter is 2', () => {
    expect(counter).toBe(2); // Boshqa test'ga bog'liq!
});

// ✅ Yaxshi (har bir test mustaqil):
test('counter starts at 0', () => {
    const counter = 0;
    expect(counter).toBe(0);
});
test('counter can be set to 1', () => {
    const counter = 1;
    expect(counter).toBe(1);
});
```

---

### 4. **Edge Cases Test Qilish**

```javascript
// Normal case:
test('validatePositive accepts 10', () => {
    expect(validatePositive(10, 'price')).toBe(10);
});

// Edge cases:
test('validatePositive rejects 0', () => {
    expect(() => validatePositive(0, 'price')).toThrow();
});

test('validatePositive rejects negative numbers', () => {
    expect(() => validatePositive(-5, 'price')).toThrow();
});

test('validatePositive accepts very large numbers', () => {
    expect(validatePositive(999999999, 'price')).toBe(999999999);
});
```

---

## 📈 Testing Pyramid

```
        /\
       /  \      E2E Tests (kam, lekin muhim)
      /____\
     /      \    Integration Tests (o'rtacha)
    /________\
   /          \  Unit Tests (ko'p, asosiy)
  /____________\
```

**Ratio:**
- Unit Tests: 70% (eng ko'p)
- Integration Tests: 20% (o'rtacha)
- E2E Tests: 10% (eng kam, lekin muhim)

---

## 🚀 Setup Plan

### Phase 1: Basic Setup (Hozir)

1. ✅ Jest package qo'shish
2. ✅ package.json setup
3. ✅ Test fayl tuzilishi
4. ✅ First test yozish (validation middleware)

---

### Phase 2: More Tests (Keyingi)

5. ⏭️ Error handler tests
6. ⏭️ Route integration tests
7. ⏭️ Test database setup

---

### Phase 3: CI/CD (Keyingi)

8. ⏭️ GitHub Actions setup
9. ⏭️ Coverage reporting
10. ⏭️ Test automation

---

## 💡 Xulosa

### Testing Nega Kerak?

1. **Xatoliklarni Tezda Topish** ⚡
2. **Refactoring'ni Xavfsiz Qilish** 🔒
3. **Kodni Hujjatlashtirish** 📚
4. **Confidence (Ishonch)** 💪

### Testing Turlari:

1. **Unit Tests** - Funksiyalar (70%)
2. **Integration Tests** - Birgalikda ishlash (20%)
3. **E2E Tests** - Butun tizim (10%)

### Setup Qadamlar:

1. Jest package qo'shish
2. package.json setup
3. First test yozish
4. Test database setup (keyingi)

---

**Status:** ⏭️ Tushuntirish tayyor, setup boshlanmoqda! 🚀
