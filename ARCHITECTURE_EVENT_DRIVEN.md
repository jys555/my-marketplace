# 🏗️ EVENT-DRIVEN ARCHITECTURE - STOCK SYNC
## Real-time, Efficient, Professional

---

## 🎯 CONCEPT

### ❌ OLD (Polling - Yomon):
```
Har 30 daqiqa:
  ├── Uzum API: GET /stock → 100 requests/kun
  ├── Wildberries API: GET /stock → 100 requests/kun
  └── OZON API: GET /stock → 100 requests/kun
  
Total: 300+ requests/kun (ortiqcha!)
```

### ✅ NEW (Webhook - Yaxshi):
```
Faqat stock o'zgarganda:
  Uzum → Webhook → Bizga → Push boshqalarga
  
Total: Faqat haqiqiy o'zgarishlar (10-20 requests/kun)
```

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│              STOCK CHANGE TRIGGERS                   │
└─────────────────────────────────────────────────────┘
        ↓                ↓                ↓
   [Webhook]      [A Store Order]   [Manual Order]
   Uzum/WB/OZON    Telegram MiniApp  Seller App
        ↓                ↓                ↓
        └────────────────┴────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   INVENTORY SERVICE (Bizniki)      │
        │   --------------------------------  │
        │   1. Validate stock change         │
        │   2. Update inventory.quantity     │
        │   3. Create inventory_movements    │
        │   4. Calculate analytics           │
        │   5. Trigger PUSH to all platforms │
        └────────────────────────────────────┘
                         ↓
            ┌────────────┴────────────┐
            ↓                         ↓
      [PUSH to APIs]          [WebSocket/SSE]
      Marketplaces            Amazing Store
      - Uzum ✅               - Real-time ✅
      - Wildberries ✅        - No polling ✅
      - OZON ✅
```

---

## 🔄 WORKFLOW SCENARIOS

### 1️⃣ **MARKETPLACE WEBHOOK** (Uzum'da sotildi)

```javascript
// Uzum webhook bizga yuboradi
POST https://our-api.com/webhooks/marketplaces/stock-update
Headers: {
  "X-Webhook-Signature": "abc123...",
  "X-Marketplace-ID": "uzum"
}
Body: {
  "event": "stock.updated",
  "marketplace_product_id": "UZUM-12345",
  "sku": "PHONE-001",
  "previous_stock": 50,
  "current_stock": 47,
  "change": -3,
  "timestamp": "2026-01-09T10:30:00Z",
  "reason": "sold" // yoki "cancelled"
}

// Bizning tizimimiz:
1. ✅ Signature verify (security)
2. ✅ SKU orqali product topish
3. ✅ inventory.quantity: 50 → 47
4. ✅ inventory_movements yozuvi:
   {
     product_id: 123,
     movement_type: 'marketplace_sale',
     quantity_change: -3,
     marketplace_id: UZUM,
     quantity_before: 50,
     quantity_after: 47
   }
5. ✅ marketplace_products yangilash:
   {
     marketplace_stock: 47,
     previous_stock: 50,
     stock_last_synced_at: NOW()
   }
6. ✅ Analytics (real-time):
   - 3 ta mahsulot sotildi
   - Platform: Uzum
   - Narx: marketplace_products.marketplace_price
   - Foyda: (price - cost_price) * 3

7. ✅ PUSH to ALL platforms:
   // Wildberries
   PUT https://api.wildberries.ru/stocks
   { "sku": "PHONE-001", "stock": 47 }
   
   // OZON
   POST https://api.ozon.ru/v1/product/import/stocks
   { "items": [{"offer_id": "PHONE-001", "stock": 47}] }
   
   // Amazing Store (WebSocket)
   ws.broadcast('stock_update', {
     sku: 'PHONE-001',
     stock: 47
   })

Total time: < 1 sekund ⚡
Total requests: Faqat 3 ta (PUSH) ✅
```

---

### 2️⃣ **AMAZING STORE ORDER** (Mini App'da buyurtma)

```javascript
// User Amazing Store'da buyurtma qildi
1. Order yaratildi (marketplace_id = AMAZING_STORE)
2. inventory.quantity: 47 → 46
3. inventory_movements:
   {
     movement_type: 'sale',
     quantity_change: -1,
     marketplace_id: AMAZING_STORE,
     reference_type: 'order',
     reference_id: ORDER_ID
   }

4. PUSH to ALL API marketplaces:
   - Uzum: POST /stock {sku, stock: 46}
   - Wildberries: PUT /stocks {sku, stock: 46}
   - OZON: POST /stocks {sku, stock: 46}

5. WebSocket to Amazing Store:
   - Real-time yangilanish (46)
   - Boshqa userlar ko'radi

Total time: < 1 sekund ⚡
```

---

### 3️⃣ **MANUAL ORDER** (Seller App'da qo'lda zakas)

```javascript
// Admin OLX'dan telefon orqali buyurtma oldi
1. Seller App'da qo'lda order yaratdi:
   {
     marketplace_id: OLX (manual type),
     customer_name: "Alisher",
     customer_phone: "+998901234567",
     products: [{sku: "PHONE-001", quantity: 2}]
   }

2. inventory.quantity: 46 → 44
3. inventory_movements:
   {
     movement_type: 'sale',
     quantity_change: -2,
     marketplace_id: OLX,
     reference_type: 'order'
   }

4. PUSH to ALL:
   - Uzum: 44
   - Wildberries: 44
   - OZON: 44
   - Amazing Store: WebSocket (44)

Total time: < 1 sekund ⚡
```

---

## 🗄️ DATABASE CHANGES

### 1️⃣ **MARKETPLACE_WEBHOOKS** (New table)
```sql
CREATE TABLE marketplace_webhooks (
    id SERIAL PRIMARY KEY,
    
    -- Webhook info
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'stock.updated', 'order.created', etc.
    
    -- Payload
    payload JSONB NOT NULL,
    signature VARCHAR(500), -- for verification
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending', -- pending, processed, failed, retry
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_marketplace ON marketplace_webhooks(marketplace_id);
CREATE INDEX idx_webhooks_status ON marketplace_webhooks(status) WHERE status = 'pending';
CREATE INDEX idx_webhooks_event ON marketplace_webhooks(event_type);
CREATE INDEX idx_webhooks_created ON marketplace_webhooks(created_at DESC);
```

**WHY:**
- Webhook history
- Retry mechanism
- Debugging & monitoring

---

### 2️⃣ **MARKETPLACES** table update
```sql
ALTER TABLE marketplaces ADD COLUMN webhook_url TEXT;
ALTER TABLE marketplaces ADD COLUMN webhook_secret TEXT;
ALTER TABLE marketplaces ADD COLUMN supports_webhooks BOOLEAN DEFAULT FALSE;
ALTER TABLE marketplaces ADD COLUMN webhook_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN marketplaces.webhook_url IS 'URL for receiving webhooks from marketplace';
COMMENT ON COLUMN marketplaces.webhook_secret IS 'Secret for webhook signature verification';
COMMENT ON COLUMN marketplaces.supports_webhooks IS 'Platform supports webhooks (API limitation)';
COMMENT ON COLUMN marketplaces.webhook_enabled IS 'Webhooks enabled for this marketplace';
```

**WHY:**
- Webhook configuration
- Security (signature verification)
- Feature flag (enable/disable)

---

### 3️⃣ **SYNC_LOGS** table update
```sql
ALTER TABLE sync_logs ADD COLUMN trigger_type VARCHAR(20); -- 'webhook', 'manual', 'scheduled'

COMMENT ON COLUMN sync_logs.trigger_type IS 'What triggered this sync: webhook (real-time), manual (admin), scheduled (fallback cron)';
```

**WHY:**
- Track sync source
- Analytics on webhook vs polling

---

## 🔐 WEBHOOK SECURITY

### Signature Verification:
```javascript
// Marketplaceda (Uzum):
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Webhook-Signature'] = signature;

// Bizda:
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

if (!verifyWebhookSignature(payload, signature, marketplace.webhook_secret)) {
  throw new Error('Invalid webhook signature');
}
```

---

## 🔄 HYBRID APPROACH (Best of Both Worlds)

### ✅ WEBHOOK (Primary - Real-time):
```javascript
// 95% marketplacelar webhook qo'llab-quvvatlaydi
if (marketplace.supports_webhooks && marketplace.webhook_enabled) {
  // Webhook orqali real-time sync
  // No polling needed ✅
}
```

### ✅ POLLING (Fallback - Rare):
```javascript
// Faqat webhook yo'q platformalar uchun
if (!marketplace.supports_webhooks) {
  // CRON job har 2-4 soatda (kam)
  // Masalan: eski API'lar, test environmentlar
}
```

**EXAMPLE:**
- Uzum: ✅ Webhook (real-time)
- Wildberries: ✅ Webhook (real-time)
- OZON: ✅ Webhook (real-time)
- Amazing Store: ✅ WebSocket (real-time)
- Test Marketplace: ⏰ Polling (har 2 soat, fallback)

---

## 📊 PERFORMANCE COMPARISON

### POLLING (Old):
```
API Calls/day: 300+ (har 30 daqiqa × 3 platformalar)
Database writes/day: 300+
Latency: 30 daqiqa (max)
Cost: 💰💰💰 (ko'p)
```

### WEBHOOK (New):
```
API Calls/day: 10-20 (faqat haqiqiy o'zgarishlar)
Database writes/day: 10-20
Latency: < 1 sekund ⚡
Cost: 💰 (kam)
```

**SAVINGS:**
- ✅ API calls: **95% kamayish** (300 → 15)
- ✅ Database writes: **95% kamayish**
- ✅ Cost: **90%+ kamayish**
- ✅ Latency: **99.9% yaxshilash** (30 min → 1 sec)

---

## 🚀 IMPLEMENTATION STEPS

### 1. Webhook Endpoints:
```javascript
// POST /api/webhooks/marketplaces/stock-update
router.post('/webhooks/marketplaces/stock-update', async (req, res) => {
  const { marketplace_id, signature, payload } = req;
  
  // 1. Verify signature
  if (!verifySignature(payload, signature, marketplace.webhook_secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Save webhook (async processing)
  await saveWebhook(marketplace_id, payload);
  
  // 3. Respond immediately (200 OK)
  res.status(200).json({ received: true });
  
  // 4. Process async (background job)
  processWebhookAsync(payload);
});
```

### 2. Stock Update Service:
```javascript
async function updateStock(productId, newStock, source) {
  // 1. Update inventory
  await db.query(
    'UPDATE inventory SET quantity = $1 WHERE product_id = $2',
    [newStock, productId]
  );
  
  // 2. Create movement
  await createInventoryMovement({
    product_id: productId,
    quantity_change: newStock - oldStock,
    source: source
  });
  
  // 3. Push to all platforms
  await pushStockToAllPlatforms(productId, newStock);
  
  // 4. WebSocket broadcast
  wss.broadcast('stock_update', {
    product_id: productId,
    stock: newStock
  });
}
```

### 3. Push to Platforms:
```javascript
async function pushStockToAllPlatforms(productId, newStock) {
  const platforms = await getActiveAPIPlatforms(productId);
  
  const pushPromises = platforms.map(async (platform) => {
    try {
      await platform.api.updateStock(
        platform.marketplace_sku,
        newStock
      );
      
      await logSyncSuccess(platform.id, 'stock', 'push');
    } catch (error) {
      await logSyncError(platform.id, 'stock', error);
    }
  });
  
  await Promise.allSettled(pushPromises);
}
```

---

## ✅ ADVANTAGES

✅ **Real-time** - Darhol yangilanadi (< 1 sekund)  
✅ **Efficient** - Faqat o'zgarganda sync  
✅ **Cost-effective** - 95% kam API calls  
✅ **Scalable** - 1000 ta marketplace bo'lsa ham OK  
✅ **Reliable** - Webhook history + retry mechanism  
✅ **Secure** - Signature verification  
✅ **Professional** - Industry standard  

---

## 🎯 FINAL ARCHITECTURE

```
EVENT-DRIVEN STOCK SYNC
├── Webhooks (Primary - Real-time)
│   ├── Uzum → Webhook → Update → Push
│   ├── Wildberries → Webhook → Update → Push
│   └── OZON → Webhook → Update → Push
│
├── Internal Events (Real-time)
│   ├── Amazing Store Order → Update → Push
│   └── Manual Order → Update → Push
│
└── Polling (Fallback - Rare)
    └── Legacy APIs → Cron (2-4 soat)
```

**Bu architecture professional, scalable, va cost-effective!** 🚀

