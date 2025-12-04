# Seller App

Multi-marketplace seller management system - alohida loyiha, lekin `my-marketplace` bilan bir xil database'da ishlaydi.

## Struktura

```
seller-app/
├── backend/          # Express.js backend
│   ├── server.js
│   ├── db.js         # Bir xil database connection
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── migrations/    # Database migrations
│   └── utils/        # Utilities
└── frontend/         # Vanilla JS frontend
    ├── index.html
    ├── app.js
    ├── ui.js
    ├── api.js
    ├── style.css
    └── pages/        # Sahifa fayllari
```

## Database

- **Bir xil PostgreSQL database** (`amazing-store` bilan)
- **Connection string:** `DATABASE_URL` environment variable
- **Connection Pool:** `max: 15` connection (optimallashtirilgan)
- **Mavjud jadvallar:** `products`, `orders`, `order_items` (Amazing Store)
- **Yangi jadvallar:** `marketplaces`, `marketplace_products`, `purchases`, `inventory`, `product_prices`, `daily_analytics`, va boshqalar

## Installation

```bash
cd seller-app/backend
npm install
```

## Environment Variables

`.env` faylida:

```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
```

## Run

```bash
# Backend
cd seller-app/backend
npm start

# Development
npm run dev
```

## Deployment

### Railway (Backend)

**Service Configuration:**
- Service Name: `seller-app-backend`
- Root Directory: `seller-app/backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Port: Railway avtomatik assign qiladi

**Environment Variables:**
- `DATABASE_URL` - Shared PostgreSQL database (bir xil Amazing Store bilan)
- `FRONTEND_URL` - Seller App Vercel URL
- `PORT` - Railway avtomatik assign qiladi

### Vercel (Frontend)

**Project Configuration:**
- Project Name: `seller-app-frontend`
- Root Directory: `seller-app/frontend`
- Build Command: (yo'q - static files)
- Output Directory: `.` (root)

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://seller-app-backend.up.railway.app/api/:path*"
    }
  ]
}
```

Batafsil qo'llanma: [DEPLOYMENT.md](../DEPLOYMENT.md)

## API Endpoints

- `/api/seller/marketplaces` - Marketplace boshqaruvi
- `/api/seller/products` - Mahsulotlar (Amazing Store)
- `/api/seller/prices` - Narxlar
- `/api/seller/purchases` - Omborga kirimlar
- `/api/seller/inventory` - Ombor boshqaruvi
- `/api/seller/orders` - Buyurtmalar
- `/api/seller/analytics` - Analitika

## Features

- **Amazing Store Integration:** Amazing Store tanlanganda, admin funksiyalari ochiladi (tovarlarni qo'shish/edit qilish)
- **API'siz tarmoqlar:** Manual tarmoqlar uchun faqat statistika
- **Multi-marketplace:** Uzum, Yandex Market, Amazing Store, Manual
- **Inventory Management:** Avtomatik ombor boshqaruvi
- **Analytics:** Umumiy va marketplace bo'yicha analitika

