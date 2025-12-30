# 🏥 Health Check - Batafsil Qo'llanma

## ❓ Health Check Nima?

**Health Check** - Bu server'ning yashayotganini va to'g'ri ishlayotganini tekshirish.

**Maqsad:**
- Server ishlayaptimi?
- Database ulanishi bormi?
- Memory qanday ishlatilmoqda?
- Barcha servicelar to'g'ri ishlamoqdamimi?

---

## 🎯 Health Check Endpoint

### Endpoint:

```
GET /health
```

### Response Format:

**Healthy Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-12T10:30:45.123Z",
  "service": "seller-app-backend",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s",
    "started": "2024-12-12T09:30:45.123Z"
  },
  "memory": {
    "heapUsed": "45.2 MB",
    "heapTotal": "65.5 MB",
    "rss": "120.3 MB",
    "external": "2.1 MB",
    "percentage": 69
  },
  "database": {
    "status": "connected",
    "responseTime": "5ms",
    "pool": {
      "total": 15,
      "idle": 10,
      "active": 5,
      "waiting": 0
    }
  },
  "cache": {
    "enabled": true,
    "size": "N/A",
    "hitRate": "N/A"
  },
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "env": "production",
    "pid": 12345
  }
}
```

**Degraded Response (200):**
```json
{
  "status": "degraded",
  "timestamp": "2024-12-12T10:30:45.123Z",
  "service": "seller-app-backend",
  "uptime": { ... },
  "memory": {
    "percentage": 92,
    ...
  },
  "database": {
    "status": "connected",
    ...
  },
  "warnings": [
    "High memory usage detected"
  ],
  ...
}
```

**Unhealthy Response (503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-12-12T10:30:45.123Z",
  "service": "seller-app-backend",
  "database": {
    "status": "disconnected",
    "error": "Connection timeout"
  },
  ...
}
```

---

## 📊 Health Check Komponentlari

### 1. Status ✅

**Status Types:**
- `healthy` 🟢 - Barcha servicelar ishlamoqda
- `degraded` 🟡 - Server ishlayapti, lekin ba'zi muammolar bor
- `unhealthy` 🔴 - Critical servicelar ishlamoqda emas

**Determination:**
- `unhealthy` - Database disconnected
- `degraded` - Memory usage > 90%
- `healthy` - Barcha narsalar yaxshi

---

### 2. Uptime ⏱️

**Nima:**
- Server qancha vaqtdan beri ishlayapti
- Server start vaqti

**Format:**
- `seconds` - Sekundlarda
- `formatted` - "1d 2h 30m 15s" formatida
- `started` - ISO timestamp

**Misol:**
```json
{
  "seconds": 93780,
  "formatted": "1d 2h 3m 0s",
  "started": "2024-12-11T08:27:45.123Z"
}
```

---

### 3. Memory Usage 💾

**Nima:**
- Heap memory ishlatilishi
- RSS (Resident Set Size)
- External memory
- Percentage usage

**Format:**
- `heapUsed` - Ishlatilgan heap memory (MB)
- `heapTotal` - Jami heap memory (MB)
- `rss` - Resident Set Size (MB)
- `external` - External memory (MB)
- `percentage` - Foiz (heapUsed / heapTotal * 100)

**Misol:**
```json
{
  "heapUsed": "45.2 MB",
  "heapTotal": "65.5 MB",
  "rss": "120.3 MB",
  "external": "2.1 MB",
  "percentage": 69
}
```

**Warning:**
- Agar `percentage > 90%` → `degraded` status
- Memory to'lib qolish xavfi

---

### 4. Database Connection 🗄️

**Nima:**
- Database connection status
- Response time
- Connection pool stats

**Format:**
- `status` - "connected" yoki "disconnected"
- `responseTime` - Query response time (ms)
- `pool` - Connection pool statistics
  - `total` - Jami connection'lar
  - `idle` - Bo'sh connection'lar
  - `active` - Faol connection'lar
  - `waiting` - Kutayotgan connection'lar

**Misol:**
```json
{
  "status": "connected",
  "responseTime": "5ms",
  "pool": {
    "total": 15,
    "idle": 10,
    "active": 5,
    "waiting": 0
  }
}
```

**Critical:**
- Agar `status !== "connected"` → `unhealthy` status
- Server ishlamaydi

---

### 5. Cache Statistics 📦

**Nima:**
- Cache enabled/disabled
- Cache size
- Cache hit rate (agar mavjud bo'lsa)

**Format:**
- `enabled` - Cache yoqilganmi?
- `size` - Cache hajmi
- `hitRate` - Cache hit rate (agar mavjud bo'lsa)

**Misol:**
```json
{
  "enabled": true,
  "size": "N/A",
  "hitRate": "N/A"
}
```

---

### 6. Environment Info 🌍

**Nima:**
- Node.js versiyasi
- Platform
- Environment (development/production)
- Process ID

**Format:**
- `nodeVersion` - Node.js versiyasi (v18.17.0)
- `platform` - Platform (linux, win32, darwin)
- `env` - Environment (development, production)
- `pid` - Process ID

**Misol:**
```json
{
  "nodeVersion": "v18.17.0",
  "platform": "linux",
  "env": "production",
  "pid": 12345
}
```

---

## 🔍 Health Check Usage

### Testing Locally:

```bash
# Seller App
curl http://localhost:3001/health

# Amazing Store
curl http://localhost:3000/health
```

### Production Monitoring:

**UptimeRobot, Pingdom, StatusCake:**
```
Endpoint: https://your-domain.com/health
Expected Status: 200
Check Interval: 1-5 minutes
```

**Railway/Vercel:**
- Health check endpoint avtomatik tekshiriladi
- Agar 503 qaytarsa - server restart qilinadi

---

## ⚠️ Status Codes

### 200 OK ✅

**Healthy:**
- Database connected
- Memory usage < 90%
- Barcha servicelar ishlamoqda

**Degraded:**
- Database connected
- Memory usage > 90%
- Server ishlayapti, lekin warning bor

---

### 503 Service Unavailable ❌

**Unhealthy:**
- Database disconnected
- Critical servicelar ishlamoqda emas
- Server to'liq ishlamaydi

---

## 📋 Health Check Logic

### Status Determination:

```javascript
// 1. Check database
if (database.status !== 'connected') {
    status = 'unhealthy'; // CRITICAL
}

// 2. Check memory
if (memory.percentage > 90) {
    status = 'degraded'; // WARNING
}

// 3. Default
if (status === undefined) {
    status = 'healthy'; // OK
}
```

---

## 🎯 Best Practices

### 1. **Monitoring Frequency**

- **Development:** Manual check
- **Production:** 1-5 minutes interval
- **Critical Services:** 1 minute interval

---

### 2. **Alerting**

- `unhealthy` → Immediate alert (SMS, Email, Telegram)
- `degraded` → Warning alert
- `healthy` → No alert

---

### 3. **Logging**

- Har bir health check log'ga yoziladi
- Degraded/unhealthy statuslar alohida log qilinadi

---

## 💡 Xulosa

### Health Check Features:

✅ **Comprehensive** - Barcha muhim komponentlar  
✅ **Detailed** - Batafsil ma'lumotlar  
✅ **Simple** - Oson tushunish va ishlatish  
✅ **Reliable** - To'g'ri status ko'rsatish  
✅ **Fast** - Tez javob (< 100ms)

---

**Status:** ✅ Health Check to'liq va batafsil! 🚀
