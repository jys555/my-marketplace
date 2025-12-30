# 📝 Logging - Nima va Qanday?

## ❓ Logging Nima?

**Logging** - Bu dasturning qanday ishlayotganini yozib qoldirish.

**Misol:**
```
2024-12-12 10:30:45 [INFO] Server started on port 3000
2024-12-12 10:30:50 [INFO] User authenticated: 12345
2024-12-12 10:30:55 [ERROR] Database connection failed
```

---

## 🎯 Logging Nega Kerak?

### 1. **Xatoliklarni Topish** 🐛

**Muammo:**
- Production'da xatolik bo'ldi
- Qayerda va qachon bo'lganini bilish kerak

**Hal qilish:**
- Loglar yoziladi
- Xatolik vaqti, joyi, sababi log'da bo'ladi
- Tezda topish mumkin ✅

---

### 2. **Monitoring** 📊

**Nima:**
- Qancha request keldi?
- Qaysi endpoint eng ko'p ishlatilmoqda?
- Server qanday ishlayapti?

**Hal qilish:**
- Request loglar yoziladi
- Analiz qilish mumkin ✅

---

### 3. **Debugging** 🔍

**Muammo:**
- Kod ishlamayapti, sababini topish qiyin

**Hal qilish:**
- Har bir qadam log'ga yoziladi
- Qaysi qadamda muammo ekanini ko'rish mumkin ✅

---

## 📋 Logging Level'lar

### 1. **ERROR** 🔴
- Xatoliklar (critical)
- Database connection failed
- Validation errors

**Misollar:**
```
[ERROR] Database connection failed: timeout
[ERROR] Payment processing failed: insufficient funds
```

---

### 2. **WARN** 🟡
- Xavfli holatlar (lekin xatolik emas)
- Deprecated function ishlatilgan
- Rate limit yaqinlashmoqda

**Misollar:**
```
[WARN] API key expires in 7 days
[WARN] High memory usage: 85%
```

---

### 3. **INFO** 🔵
- Oddiy ma'lumotlar
- Server start bo'ldi
- User login qildi
- Request keldi

**Misollar:**
```
[INFO] Server started on port 3000
[INFO] User authenticated: 12345
[INFO] GET /api/products - 200 OK
```

---

### 4. **DEBUG** 🟢
- Detal ma'lumotlar (development uchun)
- Variable qiymatlari
- Function call'lar

**Misollar:**
```
[DEBUG] Processing product ID: 123
[DEBUG] Cache hit for key: products:page:1
[DEBUG] Database query executed: SELECT * FROM products
```

---

## 💾 Logging Qayerda Saqlanadi?

### ❌ Database'da SAQLANMAYDI (Asosiy loglar)

**Nega?**
- ✅ Har bir request log'ga yoziladi
- ✅ Ko'p loglar (kuniga minglab)
- ✅ Database xarajati juda katta
- ✅ Performance muammolari

**Misol:**
```
Har bir request → 1 log
1000 request/kun → 1000 log entry
1000 log/kun × 365 kun = 365,000 log entry/yil

Agar har bir log 1KB bo'lsa:
365,000 KB = 365 MB/yil (faqat loglar!)

+ Database storage xarajati
+ Database query xarajati
+ Database performance yomonlashadi
```

---

### ✅ FILE'da Saqlanadi (Asosiy)

**Nima:**
- Log fayllar server'da saqlanadi
- `logs/app.log`, `logs/error.log`
- Oson o'qish
- Xarajatsiz

**Misol:**
```
logs/
├── app.log         (INFO, WARN loglar)
├── error.log       (ERROR loglar)
└── combined.log    (Barcha loglar)
```

**Avantajlar:**
- ✅ Xarajatsiz (file system)
- ✅ Tez yozish
- ✅ Katta hajmli loglar
- ✅ Database yuklamaydi

---

### ✅ Console'da Ko'rsatiladi (Development)

**Nima:**
- Development'da console'ga chiqadi
- Production'da file'ga yoziladi

**Misol:**
```javascript
logger.info('Server started'); // Console'da ko'rinadi (dev)
                              // File'ga yoziladi (prod)
```

---

## 🗄️ Database'da Qanday Loglar Saqlanadi?

### ✅ Faqat CRITICAL loglar

**Qaysilar?**
- ✅ User actions (audit log)
- ✅ Payment transactions
- ✅ Security events (login attempts, failed auth)
- ✅ Important business events

**Nega?**
- ✅ Bu loglar kam (kuniga 10-100 ta)
- ✅ Uzun muddat saqlash kerak
- ✅ Search qilish kerak
- ✅ Analytics uchun kerak

**Misol:**
```sql
-- audit_log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50),      -- 'login', 'purchase', 'update'
    resource VARCHAR(100),   -- 'product', 'order'
    resource_id INTEGER,
    ip_address VARCHAR(45),
    created_at TIMESTAMP
);

-- Faqat muhim eventlar:
INSERT INTO audit_log VALUES 
  ('user logged in', ...),
  ('payment completed', ...),
  ('product updated', ...);
```

**Bu loglar:**
- ❌ Har bir request'ni log qilmaydi
- ✅ Faqat muhim eventlarni log qiladi
- ✅ Kuniga 10-100 ta (yoki undan kam)
- ✅ Database'ga minimal yuk

---

## 📊 Logging Strategy

### 1. **Structured Logging (Winston/Pino)**

**Nima:**
- Log format bir xil (JSON)
- Oson parse qilish
- Oson search qilish

**Misol:**
```javascript
// Oddiy log:
console.log('User logged in: 12345');

// Structured log:
logger.info({
    event: 'user_login',
    user_id: 12345,
    ip: '192.168.1.1',
    timestamp: '2024-12-12T10:30:45Z'
});
```

---

### 2. **Log Rotation**

**Nima:**
- Log fayllar katta bo'lganda bo'linadi
- Eski loglar arxivlanadi yoki o'chiriladi

**Misol:**
```
logs/
├── app.log           (hozirgi)
├── app.2024-12-11.log (kecha)
├── app.2024-12-10.log (ikki kun oldin)
└── app.2024-12-09.log (uch kun oldin)
```

**Avantajlar:**
- ✅ Disk to'lib qolmaydi
- ✅ Eski loglar saqlanadi
- ✅ Yengil ishlaydi

---

### 3. **Log Levels by Environment**

**Development:**
- ✅ DEBUG level (barcha loglar)
- ✅ Console'da ko'rinadi
- ✅ Detal ma'lumotlar

**Production:**
- ✅ INFO level (faqat muhim loglar)
- ✅ File'ga yoziladi
- ✅ ERROR loglar alohida file

---

## 💰 Xarajat Taqqoslash

### Database Logging (❌ Yomon)

```
1000 request/kun × 1 log = 1000 log/kun
1000 log/kun × 365 kun = 365,000 log/yil

Agar har bir log:
- 1KB storage
- 0.001 DB write operation

Xarajat:
- Storage: 365 MB/yil
- DB writes: 365,000 write/yil
- Query overhead: HIGH
- Performance: YOMON
```

**Xarajat:** 💰💰💰💰💰 (Juda katta!)

---

### File Logging (✅ Yaxshi)

```
1000 request/kun × 1 log = 1000 log/kun
File system'ga yozish

Xarajat:
- Storage: 365 MB/yil (xuddi shu)
- File writes: 365,000 write/yil
- Query overhead: YO'Q
- Performance: YAXSHI
```

**Xarajat:** 💰 (Minimal!)

---

### Hybrid (✅ Eng Yaxshi)

```
File Logging (asosiy):
- 1000 request/kun → file'ga
- Xarajat: Minimal

Database Logging (muhim):
- 10-50 event/kun → database'ga
- Xarajat: Minimal (juda kam loglar)
```

**Xarajat:** 💰 (Optimal!)

---

## 🎯 Nima Qilamiz?

### Phase 3.1: Structured Logging Setup

**1. Winston Setup** ✅
- File logging (app.log, error.log)
- Console logging (development)
- Log rotation
- JSON format

**2. Request Logging** ✅
- Har bir request log'ga yoziladi (FILE'ga)
- Response status, time, IP
- Database'ga YOZILMAYDI

**3. Error Logging** ✅
- ERROR loglar alohida file
- Stack traces
- Database'ga YOZILMAYDI

**4. Audit Logging (Keyingi)** ⏭️
- Muhim eventlar database'ga
- User actions, payments
- Kuniga 10-50 ta

---

## 📋 Logging Rules

### ✅ FILE'ga Yoziladi:

1. **Request Logging**
   - Har bir API request
   - Response status
   - Response time

2. **Error Logging**
   - Xatoliklar
   - Stack traces

3. **Application Logging**
   - Server start/stop
   - Cache operations
   - Database queries (optional)

---

### ✅ Database'ga Yoziladi (Keyingi):

1. **Audit Logs** (muhim eventlar)
   - User login/logout
   - Product create/update
   - Order create
   - Payment transactions

2. **Security Events**
   - Failed login attempts
   - Unauthorized access
   - Rate limit exceeded

**Qoida:** Faqat muhim eventlar, kuniga 10-50 ta (yoki undan kam)

---

## 💡 Xulosa

### Database Logging:
- ❌ Har bir request'ni log qilish = YOMON
- ✅ Faqat muhim eventlarni log qilish = YAXSHI

### File Logging:
- ✅ Asosiy loglar file'ga = YAXSHI
- ✅ Xarajatsiz, tez, samarali

### Hybrid Strategy:
- ✅ Asosiy loglar → FILE
- ✅ Muhim eventlar → DATABASE
- ✅ Optimal xarajat va performance

---

**Status:** ⏭️ Structured Logging setup boshlanmoqda! 🚀
