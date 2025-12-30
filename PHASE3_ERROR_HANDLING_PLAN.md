# 🛡️ Phase 3: Error Handling va Validation - Batafsil Reja

## 🎯 Maqsad

Loyihada xatolarni yaxshi boshqarish va foydalanuvchiga tushunarli xabar berish.

---

## 📊 Hozirgi Holat

### ❌ Muammolar:

1. **Inconsistent Error Handling:**
   - Ba'zi route'larda `res.status(500).json({ error: 'Internal Server Error' })`
   - Ba'zilarida `res.status(400).json({ error: '...' })`
   - Error messages har xil format

2. **Validation Yo'q:**
   - Request body validation yo'q
   - Query parameter validation yo'q
   - Type checking yo'q

3. **Database Errors:**
   - PostgreSQL error codes'ni to'g'ri handle qilinmaydi
   - Unique constraint errors - user-friendly message yo'q

4. **Frontend Error Display:**
   - Errors user-friendly emas
   - Validation errors ko'rsatilmaydi

---

## 🔧 Yechim

### Step 1: Centralized Error Handler

**Fayl:** `backend/middleware/errorHandler.js`

**Funksiya:**
- Barcha error'larni catch qilish
- Error'ni classify qilish
- User-friendly message berish
- Logging
- Structured response

**Error Types:**
- `ValidationError` (400)
- `NotFoundError` (404)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `DatabaseError` (500)
- `InternalServerError` (500)

---

### Step 2: Custom Error Classes

**Fayl:** `backend/utils/errors.js`

**Classes:**
```javascript
class ValidationError extends Error { ... }
class NotFoundError extends Error { ... }
class UnauthorizedError extends Error { ... }
class DatabaseError extends Error { ... }
```

---

### Step 3: Validation Middleware

**Fayl:** `backend/middleware/validate.js`

**Libraries:**
- `express-validator` (recommended)
- Yoki custom validation

**Validators:**
- Product validators
- Order validators
- Price validators
- User validators

---

### Step 4: Route Error Handling

**Update routes:**
- Error handler middleware qo'shish
- Try-catch'dan error handler'ga throw qilish
- Validation middleware qo'llash

---

### Step 5: Frontend Error Handling

**Update frontend:**
- Error display component
- User-friendly messages
- Validation error display
- Network error handling

---

## 📋 Implementation Checklist

### Backend:

- [ ] Error handler middleware yaratish
- [ ] Custom error classes yaratish
- [ ] Validation middleware yaratish
- [ ] Product validators
- [ ] Order validators
- [ ] Price validators
- [ ] Routes'larga error handler qo'shish
- [ ] Routes'larga validation qo'shish
- [ ] Error logging

### Frontend:

- [ ] Error display component
- [ ] Form validation
- [ ] API error handling
- [ ] User-friendly messages

---

## 🎯 Kutilayotgan Natija

### Oldin:
```javascript
// Routes'da:
try {
  // code
} catch (error) {
  res.status(500).json({ error: 'Internal Server Error' });
}
```

### Keyin:
```javascript
// Routes'da:
try {
  // code
} catch (error) {
  next(error); // Error handler'ga yuborish
}

// Error handler:
// Automatic classification, logging, user-friendly response
```

**Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a valid product name",
    "details": {
      "field": "name_uz",
      "reason": "required"
    },
    "timestamp": "2024-12-XX..."
  }
}
```

---

**Keyingi qadam:** Error handler middleware yaratish! 🚀
