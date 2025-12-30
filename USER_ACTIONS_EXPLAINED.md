# 📋 User Actions - Batafsil Qo'llanma

## ❓ User Actions Nima?

**User Actions** - Bu developer (siz) tomonidan bajarilishi kerak bo'lgan ishlar.

**Nima uchun kerak:**
- Server'da ishlash uchun packages o'rnatish kerak
- Database'da migration apply qilish kerak
- Testlarni ishga tushirish kerak

---

## 🎯 1. Database Indexes Migration Apply

### Nima qilish kerak?

**Database'ga index'larni qo'shish** - Performance uchun.

### Qanday qilish?

**Step 1: Migration faylini topish**
```
database/migrations/007_add_performance_indexes.sql
```

**Step 2: Migration apply qilish**

**Variant A: Railway'da (Production):**
1. Railway dashboard'ga kiring
2. Database service'ni oching
3. Query tab'ga o'ting
4. Migration faylini ko'chirib yuboring
5. Execute qiling

**Variant B: Local PostgreSQL'da:**
```bash
# Terminal orqali
psql -U your_username -d your_database -f database/migrations/007_add_performance_indexes.sql

# yoki
psql DATABASE_URL < database/migrations/007_add_performance_indexes.sql
```

**Step 3: Tekshirish**
```sql
-- Index'larni ko'rish
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('products', 'orders', 'order_items', 'product_prices');
```

### ⏱️ Vaqt: ~10 daqiqa

### ⚠️ Muhim:
- **Production'da:** Backup oling (agar kerak bo'lsa)
- **Local'da:** Test qiling

---

## 🎯 2. npm install va Test

### Nima qilish kerak?

**Packages o'rnatish** - Development tools.

### Qanday qilish?

**Step 1: Seller App Backend**
```bash
cd seller-app/backend
npm install
```

**Step 2: Amazing Store Backend**
```bash
cd amazing\ store/backend
npm install
```

### O'rnatiladigan packages:

**Development Dependencies:**
- `jest` - Testing framework
- `supertest` - HTTP testing
- `eslint` - Code linting
- `prettier` - Code formatting
- va boshqalar...

### Step 3: Testlarni ishga tushirish

**Seller App:**
```bash
cd seller-app/backend
npm test
```

**Amazing Store:**
```bash
cd amazing\ store/backend
npm test
```

### ⏱️ Vaqt: ~5-10 daqiqa

---

## 🎯 3. ESLint Check (Oxirida)

### Nima qilish kerak?

**Kod xatolarini topish va tuzatish.**

### Qanday qilish?

**Step 1: ESLint Check**
```bash
cd seller-app/backend
npm run lint
```

**Step 2: Xatolarni ko'rish**

ESLint ko'rsatadi:
- ❌ Error'lar
- ⚠️ Warning'lar

**Step 3: Auto-fix (Agar mumkin)**
```bash
npm run lint:fix
```

Bu ba'zi xatolarni avtomatik tuzatadi (semicolon, spacing, etc.).

**Step 4: Qolgan xatolarni tuzatish**

Men xatolarni tuzataman (agar kerak bo'lsa).

### ⏱️ Vaqt: ~15-30 daqiqa

---

## 📊 Jami Vaqt:

| Vazifa | Vaqt |
|--------|------|
| Database Migration Apply | ~10 daqiqa |
| npm install va Test | ~5-10 daqiqa |
| ESLint Check | ~15-30 daqiqa |
| **JAMI** | **~30-50 daqiqa** |

---

## ✅ Checklist:

### Database Migration:
- [ ] Migration faylini topish
- [ ] Railway/Local'da apply qilish
- [ ] Index'larni tekshirish

### npm install:
- [ ] Seller App backend (`npm install`)
- [ ] Amazing Store backend (`npm install`)
- [ ] Testlarni ishga tushirish (`npm test`)

### ESLint Check:
- [ ] ESLint check (`npm run lint`)
- [ ] Auto-fix (`npm run lint:fix`)
- [ ] Xatolarni tuzatish

---

## 💡 Maslahat:

**Ketma-ket qiling:**
1. Avval Database Migration (agar kerak bo'lsa)
2. Keyin npm install
3. Keyin Test
4. Oxirida ESLint Check

**Agar xato bo'lsa:**
- Men yordam beraman
- Xatolarni ko'rsating

---

**Status:** User actions'ni bajarish kerak! 🚀
