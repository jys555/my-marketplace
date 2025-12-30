# 📊 Metrics Implementation Plan

## 🎯 Maqsad

**Metrics endpoint** yaratish - server'ning ishlashini o'lchash:
- Request count
- Response time
- Error count
- Usage statistics

---

## 📋 Implementation Steps

### Step 1: Metrics Storage Utility ✅

**Fayl:** `utils/metrics.js`

**Features:**
- In-memory metrics storage
- Request counter
- Response time tracking
- Error counter
- Reset functionality

**API:**
```javascript
const metrics = require('./utils/metrics');

// Increment request counter
metrics.incrementRequest(method, path, statusCode, responseTime);

// Increment error counter
metrics.incrementError(statusCode);

// Get metrics
const stats = metrics.getMetrics();

// Reset metrics (opsiyonal)
metrics.reset();
```

---

### Step 2: Metrics Middleware ✅

**Fayl:** `middleware/metrics.js`

**Features:**
- Request tracking
- Response time measurement
- Error tracking
- Automatic metrics collection

**Usage:**
```javascript
app.use(metricsMiddleware);
```

---

### Step 3: Metrics Endpoint ✅

**Fayl:** `routes/metrics.js`

**Endpoint:** `GET /metrics`

**Response:**
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
    "max": 200
  },
  "errors": {
    "total": 25,
    "rate": 2.5,
    "4xx": 15,
    "5xx": 10
  }
}
```

---

### Step 4: Server Integration ✅

**Fayl:** `server.js`

**Integration:**
```javascript
const metricsMiddleware = require('./middleware/metrics');
const metricsRoutes = require('./routes/metrics');

// Add middleware
app.use(metricsMiddleware);

// Add route
app.get('/metrics', metricsRoutes.getMetrics);
```

---

## 📊 Metrics Structure

### In-Memory Storage:

```javascript
{
  requests: {
    total: 0,
    startTime: Date.now(),
    responses: [] // For response time calculation
  },
  errors: {
    total: 0,
    byStatus: {
      "400": 0,
      "404": 0,
      "500": 0
    }
  }
}
```

---

### Response Time Tracking:

```javascript
// Store response times in array
responses: [45, 50, 30, 60, ...]

// Calculate:
avg = sum(responses) / responses.length
min = Math.min(...responses)
max = Math.max(...responses)
```

---

## 🎯 Keyingi Qadamlar

1. ✅ Metrics utility yaratish
2. ✅ Metrics middleware yaratish
3. ✅ Metrics endpoint yaratish
4. ✅ Server integration
5. ⏭️ Test qilish

---

**Status:** ⏭️ Metrics implementation boshlanmoqda! 🚀
