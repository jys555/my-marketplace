# 🎯 Frontend Validation - Reja

## 📋 Formlar Ro'yxati

### Amazing Store:
1. **admin.html** - Admin kategoriya yaratish/o'zgartirish formlari
2. **index.html** - User profile, cart, favorites (API orqali)

### Seller App:
1. **catalog.html** - Product yaratish/o'zgartirish formlari
2. **inventory-purchase.html** - Purchase yaratish formi
3. **inventory.html** - Inventory adjust formi
4. **orders.html** - Order status update (dropdown)

---

## 🎯 Validation Strategy

### 1. Validation Utilities Yaratish

**Fayl:** `frontend/utils/validation.js` (har ikki loyiha uchun)

**Funktsiyalar:**
- `validateRequired(value, fieldName)` - Required field
- `validateString(value, minLength, maxLength)` - String validation
- `validateNumber(value, min, max)` - Number validation
- `validatePositive(value)` - Positive number
- `validateEmail(value)` - Email format
- `validateURL(value)` - URL format
- `validateArray(value, minItems)` - Array validation
- `showError(field, message)` - Error ko'rsatish
- `clearError(field)` - Error tozalash
- `validateForm(formData, schema)` - Form validation

---

### 2. Real-time Validation

**Pattern:**
- Input blur event'da validation
- Submit'da to'liq validation
- Error messages inline display

---

### 3. Integration

**Backend validation bilan:**
- Frontend validation backend validation'ni takrorlaydi
- Backend error'lar frontend'da ko'rsatiladi
- Consistent error messages

---

## 📝 Qaysi Form'larga Qo'shish Kerak?

### Priority 1: CRITICAL 🔴

1. **Seller App - Catalog (Product Form)**
   - name_uz (required, string, min 1)
   - price (required, positive number)
   - sale_price (optional, positive number)
   - image_url (optional, URL)
   - category_id (optional, integer)

2. **Seller App - Inventory Purchase Form**
   - purchase_date (required, date)
   - items array (required, min 1 item)
   - Each item: product_id, quantity (positive), purchase_price (positive)

3. **Seller App - Inventory Adjust**
   - quantity (required, integer)
   - reason (optional, string)

---

### Priority 2: IMPORTANT 🟠

4. **Amazing Store - Admin Categories**
   - name_uz (required, string)
   - name_ru (required, string)
   - icon (optional, string)
   - color (optional, string)

5. **Seller App - Orders Status Update**
   - status (required, oneOf: ['new', 'processing', 'ready', 'delivered', 'cancelled'])

---

## 🚀 Implementation Plan

1. ✅ Validation utilities yaratish
2. ⏭️ Seller App - Catalog form validation
3. ⏭️ Seller App - Inventory Purchase form validation
4. ⏭️ Seller App - Inventory Adjust form validation
5. ⏭️ Amazing Store - Admin Categories form validation
6. ⏭️ Backend error display integration

---

**Status:** ⏭️ Reja tayyor, implementation boshlanmoqda! 🚀
