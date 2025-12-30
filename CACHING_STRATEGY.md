# 🚀 Caching Strategiya - Batafsil Qo'llanma

## 📚 Caching Nima?

**Caching** - Ma'lumotlarni tezroq o'qish uchun vaqtinchalik saqlash. Database'ga so'rov o'rniga cache'dan o'qiladi.

### Real-Life Misol:
```
❌ ESKI:
Mijoz: "Kategoriyalarni ko'rsating"
Siz: Ombor'ga borasiz, kategoriyalarni olib kelasiz → 1 soniya

Yana mijoz: "Kategoriyalarni ko'rsating"
Siz: Yana ombor'ga borasiz, kategoriyalarni olib kelasiz → 1 soniya

✅ YANGI (Cache bilan):
Mijoz: "Kategoriyalarni ko'rsating"
Siz: Ombor'ga borasiz, kategoriyalarni olib kelasiz → 1 soniya
     + eslab qolasiz (cache'ga saqlaysiz)

Yana mijoz: "Kategoriyalarni ko'rsating"
Siz: Eslab qolgan narsadan berasiz (cache'dan) → 0.001 soniya ⚡

100 barobar tezroq!
```

---

## 🎯 Nima Cache Qilinadi va Nima Qilinmaydi?

### ✅ Cache Qilinadi (Static yoki Yaxlit Ma'lumotlar):

#### 1. **Categories (Kategoriyalar)** ⭐⭐⭐
**Nima:** Mahsulot kategoriyalari
**Nima uchun:** 
- Kam o'zgaradi (kuniga 1-2 marta)
- Ko'p so'raladi (har sahifa yuklanganda)
- Static ma'lumotlar

**Cache Strategiya:**
- TTL: 5 daqiqa (300 soniya)
- Key: `categories:${lang}` (tilga qarab)
- Invalidation: Category qo'shilganda/o'zgartirilganda

**Example:**
```javascript
GET /api/categories
Cache Key: "categories:uz"
TTL: 5 daqiqa
```

#### 2. **Banners (Bannerlar)** ⭐⭐⭐
**Nima:** Sahifa bannerlari
**Nima uchun:**
- Kam o'zgaradi (kuniga bir necha marta)
- Ko'p so'raladi (home page har safar)
- Static ma'lumotlar

**Cache Strategiya:**
- TTL: 5 daqiqa
- Key: `banners:active`
- Invalidation: Banner qo'shilganda/o'zgartirilganda/deactivated

**Example:**
```javascript
GET /api/banners
Cache Key: "banners:active"
TTL: 5 daqiqa
```

#### 3. **Product Details (Mahsulot Tafsilotlari)** ⭐⭐
**Nima:** Bitta mahsulot ma'lumotlari
**Nima uchun:**
- O'rtacha o'zgaradi (narxlar o'zgarishi mumkin)
- Ko'p so'raladi (product details page)

**Cache Strategiya:**
- TTL: 2 daqiqa (120 soniya)
- Key: `product:${productId}:${lang}`
- Invalidation: Mahsulot o'zgartirilganda/narx yangilanganda

**Example:**
```javascript
GET /api/products/123
Cache Key: "product:123:uz"
TTL: 2 daqiqa
```

#### 4. **Marketplaces List (Seller App)** ⭐⭐
**Nima:** Marketplace'lar ro'yxati
**Nima uchun:**
- Juda kam o'zgaradi (oyiga 1-2 marta)
- Ko'p so'raladi (seller app'da)

**Cache Strategiya:**
- TTL: 10 daqiqa
- Key: `marketplaces:list`
- Invalidation: Marketplace qo'shilganda/o'zgartirilganda

---

### ❌ Cache QILINMAYDI (Dynamic yoki Real-time Ma'lumotlar):

#### 1. **Products List (Mahsulotlar Ro'yxati)** ❌
**Nima uchun:**
- Ko'p so'raladi, lekin har safar boshqacha (pagination, filter, search)
- Real-time o'zgaradi (narxlar, ombor)
- Har bir so'rov boshqacha (category_id, search, page)

**Yechim:** Pagination bilan (hozirgi) - bu ham bir xil foydali!

#### 2. **Orders (Buyurtmalar)** ❌
**Nima uchun:**
- Real-time ma'lumotlar (status o'zgaradi)
- Har bir foydalanuvchi uchun boshqacha
- Muhim ma'lumotlar (to'lov, yetkazish)

#### 3. **User Data (Foydalanuvchi Ma'lumotlari)** ❌
**Nima uchun:**
- Har bir foydalanuvchi uchun boshqacha
- Real-time (cart, favorites o'zgaradi)
- Xavfsizlik (boshqa foydalanuvchi ma'lumotlari ko'rinmasligi kerak)

#### 4. **Cart (Savat)** ❌
**Nima uchun:**
- Real-time ma'lumotlar
- Har bir foydalanuvchi uchun boshqacha
- Tez-tez o'zgaradi

#### 5. **Inventory (Ombor)** ❌
**Nima uchun:**
- Real-time ma'lumotlar (qoldiq o'zgaradi)
- Muhim (yetkazib berish uchun)
- Ko'p o'zgaradi

#### 6. **Analytics (Analitika)** ❌
**Nima uchun:**
- Real-time hisob-kitoblar
- Har safar yangi hisob-kitob kerak
- Vaqt oralig'iga qarab o'zgaradi

---

## 🎯 Cache Strategiya

### Cache Layer:

```
Request
  ↓
Cache Check (Memory/Redis)
  ↓ (Agar bor bo'lsa)
Return from Cache ⚡ (0.001s)
  ↓ (Agar yo'q bo'lsa)
Database Query
  ↓
Save to Cache
  ↓
Return Response (0.1s)
```

### Cache Types:

#### 1. **Memory Cache (In-Memory)** ⭐ (Birinchi bosqich)
**Nima:** Server xotirasida saqlash
**Afzalliklari:**
- ✅ Juda tez (0.001 soniya)
- ✅ Oddiy implement qilish
- ✅ Qo'shimcha service kerak emas

**Kamchiliklari:**
- ❌ Server restart bo'lganda yo'qoladi
- ❌ Multi-server'da ishlamaydi (har server'da o'z cache'i)

**Qachon ishlatiladi:**
- Development
- Kichik loyihalar
- Birinchi bosqich

#### 2. **Redis Cache** ⭐⭐ (Production)
**Nima:** Alohida cache server (Redis)
**Afzalliklari:**
- ✅ Juda tez (0.001 soniya)
- ✅ Multi-server'da ishlaydi
- ✅ Persistent (restart bo'lsa ham saqlanadi)
- ✅ Advanced features (TTL, pub/sub)

**Kamchiliklari:**
- ❌ Alohida service kerak
- ❌ Qo'shimcha xarajat

**Qachon ishlatiladi:**
- Production
- Multi-server deployment
- Katta loyihalar

---

## 📋 Cache Implementation Plan

### Phase 1: Memory Cache (Birinchi Bosqich) ✅

#### Qaysi Endpointlar:

1. **Amazing Store:**
   - ✅ `GET /api/categories` - TTL: 5 daqiqa
   - ✅ `GET /api/banners` - TTL: 5 daqiqa

2. **Seller App:**
   - ✅ `GET /api/seller/marketplaces` - TTL: 10 daqiqa
   - ⚠️ `GET /api/seller/products` - Cache qilinmaydi (pagination, filter)
   - ⚠️ `GET /api/seller/orders` - Cache qilinmaydi (real-time)
   - ⚠️ `GET /api/seller/inventory` - Cache qilinmaydi (real-time)

#### Implementation:

**Cache Structure:**
```javascript
const cache = new Map();

// Cache item structure:
{
  data: {...},           // Ma'lumotlar
  timestamp: 1234567890,  // Qachon saqlangan
  ttl: 300               // Time To Live (soniya)
}
```

**Cache Functions:**
```javascript
// Get from cache
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // TTL tekshirish
  const age = (Date.now() - item.timestamp) / 1000; // soniya
  if (age > item.ttl) {
    cache.delete(key); // Eski ma'lumot
    return null;
  }
  
  return item.data;
}

// Set to cache
function setCache(key, data, ttl = 300) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Clear cache
function clearCache(key) {
  cache.delete(key);
}
```

---

## 🔄 Cache Invalidation (Cache'ni Tozalash)

### Qachon Tozalanadi?

#### 1. **TTL (Time To Live) orqali**
```
Cache saqlangan vaqtdan 5 daqiqa o'tgandan keyin avtomatik tozalanadi
```

#### 2. **Manual Invalidation**
```
Mahsulot o'zgartirilganda:
→ Category cache tozalash (agar category o'zgargan bo'lsa)
→ Product cache tozalash (o'sha mahsulot uchun)
```

### Invalidation Strategiya:

#### Categories Cache:
```javascript
// Category qo'shilganda/o'zgartirilganda
POST /api/seller/products (category_id bilan)
PUT /api/categories/:id
DELETE /api/categories/:id

→ clearCache('categories:uz')
→ clearCache('categories:ru')
```

#### Banners Cache:
```javascript
// Banner qo'shilganda/o'zgartirilganda
POST /api/banners
PUT /api/banners/:id
DELETE /api/banners/:id

→ clearCache('banners:active')
```

---

## 📊 Cache Performance

### Natijalar:

#### Categories (Memory Cache):
```
Oldin:
- Har bir so'rov: Database query → 50ms
- 1000 ta so'rov/kun → 50 soniya

Keyin:
- Birinchi so'rov: Database query → 50ms + Cache save
- Keyingi so'rovlar (5 daqiqa ichida): Cache → 1ms ⚡
- 1000 ta so'rov/kun → 1 soniya

50 barobar tezroq! 🚀
```

#### Database Load:
```
Oldin:
- Categories: 1000 so'rov/kun
- Banners: 1000 so'rov/kun
- Jami: 2000 so'rov/kun

Keyin (5 daqiqa cache):
- Categories: ~100 so'rov/kun (cache hit rate: 90%)
- Banners: ~100 so'rov/kun (cache hit rate: 90%)
- Jami: ~200 so'rov/kun

10 barobar kamroq database load! 💾
```

---

## 🎯 Cache Keys Structure

### Key Naming Convention:

```javascript
// Format: "resource:identifier:params"

// Categories
"categories:uz"           // O'zbekcha kategoriyalar
"categories:ru"           // Ruscha kategoriyalar

// Banners
"banners:active"          // Faol bannerlar

// Products (kelajakda)
"product:123:uz"          // 123-ID mahsulot (O'zbekcha)
"product:123:ru"          // 123-ID mahsulot (Ruscha)

// Marketplaces (Seller App)
"marketplaces:list"       // Marketplace'lar ro'yxati
```

---

## ✅ Implementation Checklist

### Amazing Store:

- [ ] Categories cache (Memory)
  - [ ] GET /api/categories
  - [ ] TTL: 5 daqiqa
  - [ ] Invalidation: Category o'zgartirilganda

- [ ] Banners cache (Memory)
  - [ ] GET /api/banners
  - [ ] TTL: 5 daqiqa
  - [ ] Invalidation: Banner o'zgartirilganda

### Seller App:

- [ ] Marketplaces cache (Memory)
  - [ ] GET /api/seller/marketplaces
  - [ ] TTL: 10 daqiqa
  - [ ] Invalidation: Marketplace o'zgartirilganda

---

## 🚀 Keyingi Bosqich (Long-term)

### Phase 2: Redis Cache (Production)

1. Redis service o'rnatish
2. Redis client sozlash
3. Memory cache → Redis migratsiya
4. Advanced features (pub/sub, clustering)

### Phase 3: Advanced Caching

1. Product details cache
2. Query result cache
3. CDN cache (static assets)

---

## 📝 Eslatmalar

1. **Cache Size:**
   - Memory cache: Server xotirasi bilan cheklangan
   - Odatda 100-1000 ta item saqlanadi
   - Eski item'lar avtomatik tozalanadi (TTL)

2. **Cache Hit Rate:**
   - Maqsad: 80-90% hit rate
   - Ya'ni 100 ta so'rovdan 80-90 tasi cache'dan

3. **Cache Warming:**
   - Server start bo'lganda cache'ni oldindan to'ldirish
   - Keyingi bosqichda qo'shiladi

4. **Cache Monitoring:**
   - Hit rate tracking
   - Cache size monitoring
   - TTL monitoring

---

## 🎯 Xulosa

### Cache Qilinadi:
- ✅ Categories (5 daqiqa)
- ✅ Banners (5 daqiqa)
- ✅ Marketplaces (10 daqiqa) - Seller App

### Cache QILINMAYDI:
- ❌ Products list (pagination bilan yaxshi)
- ❌ Orders (real-time)
- ❌ User data (real-time)
- ❌ Cart (real-time)
- ❌ Inventory (real-time)
- ❌ Analytics (real-time)

### Natija:
- ⚡ 50 barobar tezroq
- 💾 10 barobar kamroq database load
- 🚀 Serverni yengillashtirish

---

**Next Step:** Memory cache implementatsiyasi! 🎉
