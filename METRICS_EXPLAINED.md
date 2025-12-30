# 📊 Metrics - Nima va Qanday?

## ❓ Metrics Nima?

**Metrics** - Bu server'ning qanday ishlayotganini o'lchash (raqamlar bilan).

**Misol:**
- Qancha request keldi? (1000)
- Qaysi endpoint eng ko'p ishlatilmoqda? (/api/products)
- Response time qanday? (avg: 45ms)
- Qancha error bo'ldi? (5)

---

## 🎯 Metrics Nega Kerak?

### 1. **Performance Tracking** ⚡

**Nima:**
- Qaysi endpoint sekin?
- Qaysi endpoint tez?
- Average response time qanday?

**Hal qilish:**
- Response time metrics
- Endpoint-based tracking
- Slow endpoint detection ✅

---

### 2. **Usage Analytics** 📈

**Nima:**
- Qancha request/kun?
- Qaysi endpoint eng ko'p ishlatilmoqda?
- Traffic patterns

**Hal qilish:**
- Request counter
- Endpoint statistics
- Usage analytics ✅

---

### 3. **Error Monitoring** 🔴

**Nima:**
- Qancha error/kun?
- Qaysi endpoint ko'p error qaytarmoqda?
- Error rate qanday?

**Hal qilish:**
- Error counter
- Error rate calculation
- Error tracking ✅

---

## 📋 Metrics Types

### 1. **Request Metrics**

**Nima:**
- Total requests
- Requests per minute/hour
- Requests per endpoint

**Misol:**
```json
{
  "requests": {
    "total": 1000,
    "perMinute": 10,
    "perHour": 600,
    "perEndpoint": {
      "/api/products": 500,
      "/api/categories": 300,
      "/api/orders": 200
    }
  }
}
```

---

### 2. **Response Time Metrics**

**Nima:**
- Average response time
- Min/Max response time
- Response time per endpoint

**Misol:**
```json
{
  "responseTime": {
    "avg": 45,
    "min": 10,
    "max": 200,
    "perEndpoint": {
      "/api/products": { "avg": 50, "min": 20, "max": 150 },
      "/api/categories": { "avg": 30, "min": 15, "max": 100 }
    }
  }
}
```

---

### 3. **Error Metrics**

**Nima:**
- Total errors
- Error rate (%)
- Errors per endpoint
- Error types (4xx, 5xx)

**Misol:**
```json
{
  "errors": {
    "total": 25,
    "rate": 2.5,
    "perEndpoint": {
      "/api/products": 10,
      "/api/orders": 15
    },
    "byStatus": {
      "400": 10,
      "404": 5,
      "500": 10
    }
  }
}
```

---

## 🎯 Implementation Plan

### Phase 1: Basic Metrics (Hozir)

**1. Metrics Collection Middleware** ✅
- Request counter
- Response time tracking
- Error counter

**2. Metrics Storage** ✅
- In-memory storage (Map/Object)
- Reset interval (har soat/24 soat)

**3. Metrics Endpoint** ✅
- `GET /metrics`
- JSON response
- Current metrics

---

### Phase 2: Advanced Metrics (Keyingi)

**1. Time-based Metrics** ⏭️
- Per minute/hour/day
- Historical data

**2. Endpoint-based Metrics** ⏭️
- Per endpoint statistics
- Slow endpoint detection

**3. Database Metrics** ⏭️
- Query count
- Query time
- Connection pool stats

---

## 📊 Metrics Endpoint

### Endpoint:

```
GET /metrics
```

### Response Format:

```json
{
  "timestamp": "2024-12-12T10:30:45.123Z",
  "service": "seller-app-backend",
  "requests": {
    "total": 1000,
    "perMinute": 10,
    "perHour": 600
  },
  "responseTime": {
    "avg": 45,
    "min": 10,
    "max": 200,
    "p95": 100,
    "p99": 150
  },
  "errors": {
    "total": 25,
    "rate": 2.5,
    "4xx": 15,
    "5xx": 10
  },
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  }
}
```

---

## 💰 Xarajat

### Metrics Collection:

**Xarajat:** Minimal

- In-memory storage (server memory'da)
- Storage: ~1-5 MB (metrics data uchun)
- Performance impact: MINIMAL (counter increment)

**Xarajat:** 💰 (Minimal!)

---

### Advanced Metrics (Keyingi):

- Historical data storage (database)
- Time-series database (InfluxDB, TimescaleDB)
- Metrics aggregation (Prometheus, Grafana)

**Xarajat:** 💰💰 (Service xarajati, opsiyonal)

---

## 🎯 Metrics Collection Strategy

### Simple Approach (Hozir):

1. **In-Memory Storage:**
   - Map/Object'da saqlash
   - Server restart → reset

2. **Counter Increment:**
   - Har bir request → counter++
   - Response time → add to array
   - Error → error counter++

3. **Reset Interval:**
   - Har soat reset (opsiyonal)
   - Yoki server restart'da reset

---

### Advanced Approach (Keyingi):

1. **Time-based Buckets:**
   - Per minute/hour/day
   - Historical data

2. **Database Storage:**
   - Metrics table
   - Time-series data

3. **External Service:**
   - Prometheus
   - Grafana dashboard

---

## 💡 Xulosa

### Metrics Features:

✅ **Request Counting** - Total, per minute/hour  
✅ **Response Time** - Avg, min, max  
✅ **Error Tracking** - Total, rate, by status  
✅ **Simple** - In-memory, minimal overhead  
✅ **Fast** - Counter increment only  

---

**Status:** ⏭️ Metrics endpoint setup boshlanmoqda! 🚀
