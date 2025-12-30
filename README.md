# My Marketplace - Monorepo

Multi-marketplace seller management system - Amazing Store va Seller App loyihalari.

## Struktura

```
my-marketplace/
├── amazing-store/          # Amazing Store miniapp
│   ├── backend/           # Express.js backend (Railway)
│   └── frontend/          # Vanilla JS frontend (Vercel)
└── seller-app/            # Seller App (alohida loyiha)
    ├── backend/           # Express.js backend (Railway)
    └── frontend/          # Vanilla JS frontend (Vercel)
```

## Loyihalar

### Amazing Store
- **Backend:** Railway (port 3000)
- **Frontend:** Vercel
- **Database:** Railway PostgreSQL (shared)
- **Maqsad:** Telegram miniapp - mahsulotlar va buyurtmalar boshqaruvi

### Seller App
- **Backend:** Railway (port 3001)
- **Frontend:** Vercel
- **Database:** Railway PostgreSQL (shared - bir xil)
- **Maqsad:** Multi-marketplace seller management system

## Database

Ikkala loyiha bir xil PostgreSQL database'dan foydalanadi:

- **Connection Pool:**
  - Amazing Store: `max: 15` connection
  - Seller App: `max: 15` connection
  - Jami: 30 connection

- **Mavjud Jadvalar:**
  - `users`, `products`, `categories`, `banners`, `orders`, `order_items` (Amazing Store)
  - `marketplaces`, `marketplace_products`, `purchases`, `inventory`, `product_prices`, `daily_analytics`, `product_analytics` (Seller App)

## Quick Start

### Local Development

#### Amazing Store Backend
```bash
cd amazing-store/backend
npm install
npm run dev
```

#### Amazing Store Frontend
```bash
cd amazing-store/frontend
# Static files - browser'da ochish mumkin
```

#### Seller App Backend
```bash
cd seller-app/backend
npm install
npm run dev
```

#### Seller App Frontend
```bash
cd seller-app/frontend
# Static files - browser'da ochish mumkin
```

### Environment Variables

#### Amazing Store Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
FRONTEND_URL=http://localhost:3000
PORT=3000
```

#### Seller App Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
FRONTEND_URL=http://localhost:3001
PORT=3001
```

## Deployment

Batafsil qo'llanma: [DEPLOYMENT.md](DEPLOYMENT.md)

### Railway (Backend)

1. **Amazing Store Backend:**
   - Service: `amazing-store-backend`
   - Root: `amazing-store/backend`
   - URL: `https://amazing-store-backend.up.railway.app`

2. **Seller App Backend:**
   - Service: `seller-app-backend`
   - Root: `seller-app/backend`
   - URL: `https://seller-app-backend.up.railway.app`

### Vercel (Frontend)

1. **Amazing Store Frontend:**
   - Project: `amazing-store-frontend`
   - Root: `amazing-store/frontend`
   - URL: `https://amazing-store-frontend.vercel.app`

2. **Seller App Frontend:**
   - Project: `seller-app-frontend`
   - Root: `seller-app/frontend`
   - URL: `https://seller-app-frontend.vercel.app`

## Git Workflow

### Branch Strategy
- `main` - Production
- `develop` - Development
- `feature/amazing-store-*` - Amazing Store features
- `feature/seller-app-*` - Seller App features

### Commands
```bash
# Amazing Store o'zgarishlari
git checkout -b feature/amazing-store-new-feature
git add amazing-store/
git commit -m "feat(amazing-store): new feature"

# Seller App o'zgarishlari
git checkout -b feature/seller-app-new-feature
git add seller-app/
git commit -m "feat(seller-app): new feature"
```

## Features

### Amazing Store
- Telegram miniapp
- Mahsulotlar boshqaruvi
- Buyurtmalar boshqaruvi
- Kategoriyalar va bannerlar
- Admin sahifasi

### Seller App
- Multi-marketplace integratsiya (Uzum, Yandex Market, Amazing Store, Manual)
- Narxlar boshqaruvi
- Buyurtmalar boshqaruvi
- Ombor boshqaruvi
- Analitika va reporting
- Amazing Store admin funksiyalari (Amazing Store tanlanganda)

## Tech Stack

- **Backend:** Node.js, Express.js, PostgreSQL
- **Frontend:** Vanilla JavaScript, HTML, CSS, Chart.js
- **Deployment:** Railway (backend), Vercel (frontend)
- **Database:** PostgreSQL (Railway)

## Documentation

- [Developer Guide](DEVELOPER_GUIDE.md) - Complete development guide
- [CI/CD Setup Guide](CI_CD_SETUP.md) - GitHub Actions workflow guide
- [Deployment Guide](DEPLOYMENT.md)
- [Amazing Store README](amazing store/README.md)
- [Seller App README](seller-app/README.md)

### API Documentation

- **Amazing Store API:** `http://localhost:3000/api-docs` (Swagger UI)
- **Seller App API:** `http://localhost:3001/api-docs` (Swagger UI)

## CI/CD

- **GitHub Actions:** Automated testing, linting, and build
- **Railway:** Automated backend deployment (via GitHub integration)
- **Vercel:** Automated frontend deployment (via GitHub integration)

See [CI/CD Setup Guide](CI_CD_SETUP.md) for details.

## License

ISC

