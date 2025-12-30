# 📊 Monitoring - Nima va Qanday?

## ❓ Monitoring Nima?

**Monitoring** - Bu server'ning qanday ishlayotganini kuzatish va o'lchash.

**Misol:**
- Server yashayaptimi? (health check)
- Qancha request keldi? (metrics)
- Response time qanday? (performance metrics)
- Memory qancha ishlatilmoqda? (resource metrics)

---

## 🎯 Monitoring Nega Kerak?

### 1. **Server Status** 🟢

**Muammo:**
- Server ishlamay qolgan
- Lekin bu haqida tezda bilish mumkin emas
- User'lar xato oladi

**Hal qilish:**
- Health check endpoint
- Avtomatik tekshirish (har 30 soniyada)
- Server down bo'lsa - bildirish ✅

---

### 2. **Performance Tracking** ⚡

**Nima:**
- Qaysi endpoint sekin?
- Qancha request/kun?
- Response time qanday?

**Hal qilish:**
- Metrics collection
- Performance monitoring
- Slow query detection ✅

---

### 3. **Resource Usage** 💾

**Nima:**
- Memory qancha ishlatilmoqda?
- CPU yuklanganmi?
- Database connection qanday?

**Hal qilish:**
- Resource metrics
- Memory tracking
- Connection pool monitoring ✅

---

## 📋 Monitoring Turlari

### 1. **Health Check** ✅

**Nima:**
- Server yashayaptimi?
- Database ulanishi bormi?
- Basic functionality ishlayaptimi?

**Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-12T10:30:45Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

---

### 2. **Metrics** 📊

**Nima:**
- Request count
- Response time
- Error rate
- Active connections

**Endpoint:**
```
GET /metrics
```

**Response:**
```json
{
  "requests": {
    "total": 1000,
    "per_minute": 10,
    "errors": 5
  },
  "response_time": {
    "avg": 45,
    "min": 10,
    "max": 200
  },
  "database": {
    "connections": 5,
    "queries": 500
  }
}
```

---

### 3. **Resource Metrics** 💾

**Nima:**
- Memory usage
- CPU usage
- Disk usage
- Network traffic

**Qanday olinadi:**
- Node.js `process.memoryUsage()`
- System metrics (opsiyonal: `os` module)

---

## 🎯 Nima Qilamiz?

### Phase 3.1: Basic Monitoring Setup

**1. Health Check Endpoint** ✅

**Features:**
- Server status
- Database connection check
- Basic memory info
- Uptime

**Implementation:**
```javascript
app.get('/health', async (req, res) => {
    // Database connection check
    // Memory usage
    // Uptime
    // Return JSON response
});
```

---

**2. Metrics Endpoint (Keyingi)** ⏭️

**Features:**
- Request count
- Response time (avg, min, max)
- Error count
- Database connection pool stats

---

## 📊 Health Check Details

### Status Types:

1. **healthy** 🟢
   - Server ishlayapti
   - Database ulangan
   - Barcha servicelar ishlamoqda

2. **degraded** 🟡
   - Server ishlayapti
   - Lekin ba'zi muammolar bor
   - Masalan: Database connection slow

3. **unhealthy** 🔴
   - Server ishlamayapti
   - Yoki critical servicelar ishlamoqda emas
   - Masalan: Database connection yo'q

---

### Health Check Checks:

1. **Database Connection** ✅
   ```javascript
   // Simple query test
   await pool.query('SELECT 1');
   ```

2. **Memory Usage** ✅
   ```javascript
   const memory = process.memoryUsage();
   const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
   const totalMB = Math.round(memory.heapTotal / 1024 / 1024);
   ```

3. **Uptime** ✅
   ```javascript
   const uptime = process.uptime(); // seconds
   ```

---

## 💰 Xarajat

### Health Check:

**Xarajat:** Minimal (yoki FREE)

- Health check endpoint - oddiy GET request
- Database check - oddiy SELECT query
- Memory check - process.memoryUsage() (in-memory)
- Storage: YO'Q (faqat response)

**Xarajat:** 💰 (Minimal!)

---

### Advanced Monitoring (Keyingi):

- External monitoring service (UptimeRobot, Pingdom)
- Metrics aggregation (Prometheus, Grafana)
- Alerting (email, Slack, Telegram)

**Xarajat:** 💰💰 (Service xarajati, opsiyonal)

---

## 🎯 Implementation Plan

### Phase 1: Basic Health Check (Hozir)

1. ✅ `/health` endpoint yaratish
2. ✅ Database connection check
3. ✅ Memory usage
4. ✅ Uptime
5. ✅ Response format (JSON)

---

### Phase 2: Metrics (Keyingi)

1. ⏭️ Request counter middleware
2. ⏭️ Response time tracking
3. ⏭️ Error counter
4. ⏭️ `/metrics` endpoint

---

### Phase 3: Advanced (Keyingi)

1. ⏭️ External monitoring service
2. ⏭️ Alerting
3. ⏭️ Dashboard
4. ⏭️ Log aggregation

---

## 💡 Xulosa

### Health Check:

- ✅ Server status
- ✅ Database connection
- ✅ Basic metrics
- ✅ Minimal xarajat

### Metrics:

- ⏭️ Request tracking
- ⏭️ Performance metrics
- ⏭️ Error tracking

### Advanced:

- ⏭️ External services
- ⏭️ Alerting
- ⏭️ Dashboard

---

**Status:** ⏭️ Basic Monitoring setup boshlanmoqda! 🚀
