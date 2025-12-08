# Rentabillik Formulasi va Saqlash Strategiyasi

## 1. Rentabillik Formulasi

### Hozirgi Formula (Cost-based Margin):
```
profitability_percentage = ((selling_price - cost_price - commission) / cost_price) * 100
```

**Misol:**
- Cost price: 100,000 so'm
- Selling price: 150,000 so'm
- Commission: 5% = 7,500 so'm
- Profit: 150,000 - 100,000 - 7,500 = 42,500 so'm
- Profitability: (42,500 / 100,000) * 100 = **42.5%**

### Alternative Formula (Selling-based Margin):
```
profitability_percentage = ((selling_price - cost_price - commission) / selling_price) * 100
```

**Misol (xuddi shu ma'lumotlar bilan):**
- Profit: 42,500 so'm
- Profitability: (42,500 / 150,000) * 100 = **28.3%**

## Qaysi Formula To'g'ri?

### Cost-based Margin (Hozirgi):
- **Afzalliklari:**
  - Tannarxga nisbatan rentabillikni ko'rsatadi
  - Investitsiya qaytishini ko'rsatadi
  - Real loyihalarda ko'p ishlatiladi
  
- **Kamchiliklari:**
  - Sotuv narxiga nisbatan emas

### Selling-based Margin (Alternative):
- **Afzalliklari:**
  - Sotuv narxiga nisbatan rentabillikni ko'rsatadi
  - Har bir sotuvdan qancha foyda olinishini ko'rsatadi
  
- **Kamchiliklari:**
  - Investitsiya qaytishini to'liq ko'rsatmaydi

## Tavsiya

**Selling-based margin** (hozirgi formula) ishlatiladi, chunki:
1. Sotuv narxiga nisbatan rentabillikni ko'rsatadi
2. Har bir sotuvdan qancha foyda olinishini ko'rsatadi
3. Marketplace loyihalarida ko'p ishlatiladi

---

## 2. Rentabillikni Saqlash yoki Har Safar Hisoblash?

### Variant A: Database'da Saqlash (Hozirgi) ✅

**Afzalliklari:**
- ⚡ **Tezroq** - har safar hisoblash shart emas
- 💾 **Xotira samarali** - hisoblash xarajati kam
- 🔄 **Trigger orqali avtomatik yangilanadi**
- 📊 **Analitika uchun qulay** - tarixiy ma'lumotlar saqlanadi

**Kamchiliklari:**
- 💾 Database'da joy egallaydi (kichik miqdor)
- 🔄 Trigger qo'shimcha yuklanish

**Real loyihalarda:** ✅ **Tavsiya etiladi**

### Variant B: Har Safar Hisoblash

**Afzalliklari:**
- 💾 Database'da joy egallamaydi
- 🔄 Har doim to'g'ri (agar formula o'zgarsa)

**Kamchiliklari:**
- ⚠️ **Sekinroq** - har safar hisoblash kerak
- 💰 **CPU xarajati** - har safar hisoblash
- 📊 **Analitika uchun qiyin** - tarixiy ma'lumotlar yo'q

**Real loyihalarda:** ❌ **Tavsiya etilmaydi**

---

## Xulosa va Tavsiya

### 1. Formula:
✅ **Selling-based margin** (hozirgi) ishlatiladi:
```sql
-- Selling-based margin
profitability_percentage = ((selling_price - cost_price - commission) / selling_price) * 100
```

**Misol:**
- Cost price: 100,000 so'm
- Selling price: 150,000 so'm
- Commission: 5% = 7,500 so'm
- Profit: 150,000 - 100,000 - 7,500 = 42,500 so'm
- Profitability: (42,500 / 150,000) * 100 = **28.3%**

### 2. Saqlash:
✅ **Database'da saqlash** (hozirgi) - real loyihalarda standart va tavsiya etiladi.

**Sabab:**
- Trigger orqali avtomatik yangilanadi
- Tezroq va samarali
- Analitika uchun qulay

---

## O'zgartirishlar (Agar Kerak Bo'lsa)

Agar **selling-based margin** kerak bo'lsa:
1. Migration'da formulani o'zgartirish
2. Backend service'da formulani o'zgartirish
3. Trigger'da formulani o'zgartirish

