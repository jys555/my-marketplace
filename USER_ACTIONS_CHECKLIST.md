# ✅ User Actions - Checklist

## 📋 Bajarilishi Kerak Bo'lgan Ishlar:

### 1. Database Indexes Migration Apply ⏭️

**Nima qilish kerak:**
- Migration faylini topish: `database/migrations/007_add_performance_indexes.sql`
- Database'ga apply qilish (Railway yoki Local PostgreSQL)
- Index'larni tekshirish

**Qo'llanma:**
- `PHASE2_INDEXES_APPLY_GUIDE.md`

**Vaqt:** ~10 daqiqa

**Status:** ⏭️ Qilinishi kerak

---

### 2. npm install va Test ⏭️

**Nima qilish kerak:**

**Seller App Backend:**
```bash
cd seller-app/backend
npm install
npm test
```

**Amazing Store Backend:**
```bash
cd amazing\ store/backend
npm install
npm test
```

**Vaqt:** ~5-10 daqiqa

**Status:** ⏭️ Qilinishi kerak

---

### 3. ESLint Check (Oxirida) ⏭️

**Nima qilish kerak:**

**Seller App Backend:**
```bash
cd seller-app/backend
npm run lint
npm run lint:fix  # Auto-fix
```

**Amazing Store Backend:**
```bash
cd amazing\ store/backend
npm run lint
npm run lint:fix  # Auto-fix
```

**Keyin:**
- Xatolarni ko'rish
- Men qolgan xatolarni tuzataman (agar kerak bo'lsa)

**Vaqt:** ~15-30 daqiqa

**Status:** ⏭️ Qilinishi kerak (oxirida)

---

## 📊 Progress:

- [ ] Database Migration Apply
- [ ] npm install (Seller App)
- [ ] npm install (Amazing Store)
- [ ] npm test (Seller App)
- [ ] npm test (Amazing Store)
- [ ] npm run lint (Seller App)
- [ ] npm run lint (Amazing Store)
- [ ] ESLint xatolarni tuzatish

---

## 💡 Maslahat:

**Ketma-ket qiling:**
1. Database Migration (agar kerak bo'lsa)
2. npm install (har ikki backend)
3. npm test (testlarni tekshirish)
4. ESLint check (oxirida)

**Agar xato bo'lsa:**
- Xatolarni ko'rsating
- Men yordam beraman

---

**Status:** User actions checklist tayyor! 🚀
