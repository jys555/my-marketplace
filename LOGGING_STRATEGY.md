# 📝 Logging Strategy - Xarajat Optimizatsiya

## 🎯 Asosiy Qoida

### ❌ Database'da SAQLANMAYDI:

1. **Request Logs** (har bir API request)
   - Qancha: 1000+ request/kun
   - Xarajat: JUDA KATTA
   - Yechim: FILE'ga yoziladi

2. **Error Logs** (xatoliklar)
   - Qancha: 10-100 error/kun
   - Xarajat: KATTA
   - Yechim: FILE'ga yoziladi

3. **Debug Logs** (development loglar)
   - Qancha: Minglab loglar
   - Xarajat: JUDA KATTA
   - Yechim: FILE'ga yoziladi (yoki console)

---

### ✅ Database'da Saqlanadi (Keyingi - Audit Logs):

1. **Audit Logs** (muhim business eventlar)
   - Qancha: 10-50 event/kun
   - Xarajat: MINIMAL
   - Sabab: Faqat muhim eventlar

2. **Security Events** (xavfsizlik)
   - Qancha: 5-20 event/kun
   - Xarajat: MINIMAL
   - Sabab: Faqat xavfli eventlar

---

## 💰 Xarajat Taqqoslash

### Scenario 1: Database'da Hamma Loglar ❌

```
Request logging: 1000 request/kun
Error logging: 50 error/kun
Debug logging: 500 debug/kun

Jami: 1550 log entry/kun
Jami: 565,750 log entry/yil

Database xarajati:
- Storage: ~500 MB/yil
- Write operations: 565,750 write/yil
- Query overhead: HIGH
- Performance impact: CRITICAL

Xarajat: 💰💰💰💰💰 (Juda katta!)
```

---

### Scenario 2: File Logging ✅

```
Request logging: 1000 request/kun → FILE
Error logging: 50 error/kun → FILE
Debug logging: 500 debug/kun → FILE (dev only)

Jami: 1550 log entry/kun → FILE

File system xarajati:
- Storage: ~500 MB/yil (xuddi shu)
- File writes: 565,750 write/yil
- Query overhead: YO'Q
- Performance impact: MINIMAL

Xarajat: 💰 (Minimal!)
```

---

### Scenario 3: Hybrid (Bizning Strategiya) ✅✅

```
FILE Logging (asosiy):
- Request: 1000/kun → FILE
- Error: 50/kun → FILE
- Debug: 500/kun → FILE

DATABASE Logging (audit):
- User login: 20/kun → DATABASE
- Product create: 5/kun → DATABASE
- Order create: 10/kun → DATABASE
- Payment: 5/kun → DATABASE

Jami database: 40 event/kun
Jami database: 14,600 event/yil

Database xarajati:
- Storage: ~15 MB/yil
- Write operations: 14,600 write/yil
- Query overhead: MINIMAL
- Performance impact: NONE

Xarajat: 💰 (Optimal!)
```

---

## 📊 Implementation Plan

### Phase 1: Structured Logging (Hozir) ✅

**Winston Setup:**
- File logging (logs/app.log, logs/error.log)
- Console logging (development)
- Log rotation (katta fayllarni bo'lish)
- JSON format

**Request Logging:**
- Middleware: har bir request log'ga yoziladi
- Format: `{ method, url, status, time, ip }`
- Destination: FILE (logs/app.log)
- Database: ❌ YOZILMAYDI

**Error Logging:**
- Error handler: har bir error log'ga yoziladi
- Format: `{ error, stack, request }`
- Destination: FILE (logs/error.log)
- Database: ❌ YOZILMAYDI

---

### Phase 2: Audit Logging (Keyingi) ⏭️

**Database Table:**
```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50),        -- 'login', 'create_product', 'create_order'
    resource_type VARCHAR(50), -- 'product', 'order', 'user'
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,            -- Qo'shimcha ma'lumotlar
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

**Qaysi Eventlar Log Qilinadi:**
- ✅ User login/logout
- ✅ Product create/update/delete
- ✅ Order create/update status
- ✅ Payment transactions
- ✅ Failed authentication attempts

**Qaysi Eventlar Log Qilinmaydi:**
- ❌ Har bir GET request
- ❌ Cache hits/misses
- ❌ Database queries (umumiy)
- ❌ Validation errors (file'ga yoziladi)

---

## 🎯 Logging Levels

### Development:

```
DEBUG: Barcha loglar (console + file)
INFO:  Barcha loglar (console + file)
WARN:  Barcha loglar (console + file)
ERROR: Barcha loglar (console + file)
```

### Production:

```
DEBUG: Yo'q (disable)
INFO:  File (logs/app.log)
WARN:  File (logs/app.log)
ERROR: File (logs/error.log) + monitoring service
```

---

## 📋 Log Format

### Request Log (FILE):

```json
{
  "level": "info",
  "message": "HTTP request",
  "timestamp": "2024-12-12T10:30:45.123Z",
  "method": "GET",
  "url": "/api/products",
  "statusCode": 200,
  "responseTime": 45,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Error Log (FILE):

```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2024-12-12T10:30:45.123Z",
  "error": {
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n    at ..."
  },
  "request": {
    "method": "POST",
    "url": "/api/products",
    "body": {...}
  }
}
```

### Audit Log (DATABASE - Keyingi):

```json
{
  "user_id": 12345,
  "action": "create_product",
  "resource_type": "product",
  "resource_id": 789,
  "ip_address": "192.168.1.1",
  "metadata": {
    "product_name": "Test Product",
    "price": 100
  },
  "created_at": "2024-12-12T10:30:45Z"
}
```

---

## 💡 Xulosa

### Bizning Strategiya:

1. **Asosiy Logging → FILE** ✅
   - Request logs
   - Error logs
   - Application logs
   - Xarajat: Minimal

2. **Audit Logging → DATABASE** (Keyingi) ⏭️
   - Muhim eventlar
   - Kuniga 10-50 ta
   - Xarajat: Minimal

3. **Monitoring → External Service** (Keyingi) ⏭️
   - Error tracking (Sentry, LogRocket)
   - Performance monitoring
   - Xarajat: Service xarajati

---

**Status:** ⏭️ Structured Logging setup boshlanmoqda! 🚀
