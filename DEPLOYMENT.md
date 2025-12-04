# Deployment Guide

Bu dokumentatsiya Amazing Store va Seller App loyihalarini deploy qilish uchun batafsil qo'llanma.

## Struktura

```
my-marketplace/                    # Monorepo
├── amazing-store/
│   ├── backend/     # Railway'da deploy
│   └── frontend/    # Vercel'da deploy
└── seller-app/
    ├── backend/     # Railway'da deploy (alohida service)
    └── frontend/    # Vercel'da deploy (alohida project)
```

## Database Connection Pool

Ikkala backend bir xil PostgreSQL database'dan foydalanadi. Connection pool optimallashtirilgan:

- **Amazing Store Backend:** `max: 15` connection
- **Seller App Backend:** `max: 15` connection
- **Jami:** 30 connection (database limiti odatda 100)

## Railway Deployment (Backend)

### Amazing Store Backend

1. **Railway'da yangi service yaratish:**
   - Service Name: `amazing-store-backend`
   - GitHub repo'ni ulash (monorepo)
   - Root Directory: `amazing-store/backend`

2. **Build va Start Commands:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: Railway avtomatik assign qiladi

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   FRONTEND_URL=https://amazing-store-frontend.vercel.app
   PORT=3000 (Railway avtomatik)
   ```

4. **Deploy:**
   - Railway avtomatik `main` branch'dan deploy qiladi
   - Service URL: `https://amazing-store-backend.up.railway.app`

### Seller App Backend

1. **Railway'da yangi service yaratish:**
   - Service Name: `seller-app-backend`
   - GitHub repo'ni ulash (bir xil monorepo)
   - Root Directory: `seller-app/backend`

2. **Build va Start Commands:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: Railway avtomatik assign qiladi

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db (bir xil database)
   FRONTEND_URL=https://seller-app-frontend.vercel.app
   PORT=3001 (Railway avtomatik)
   ```

4. **Deploy:**
   - Railway avtomatik `main` branch'dan deploy qiladi
   - Service URL: `https://seller-app-backend.up.railway.app`

**Muhim:** Ikkala backend bir xil `DATABASE_URL` dan foydalanadi, lekin alohida service sifatida deploy qilinadi.

## Vercel Deployment (Frontend)

### Amazing Store Frontend

1. **Vercel'da yangi project yaratish:**
   - Project Name: `amazing-store-frontend`
   - GitHub repo'ni ulash (monorepo)
   - Root Directory: `amazing-store/frontend`

2. **Build Settings:**
   - Build Command: (yo'q - static files)
   - Output Directory: `.` (root)
   - Install Command: (yo'q)

3. **vercel.json konfiguratsiyasi:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://amazing-store-backend.up.railway.app/api/:path*"
       }
     ]
   }
   ```

4. **Deploy:**
   - Vercel avtomatik `main` branch'dan deploy qiladi
   - Frontend URL: `https://amazing-store-frontend.vercel.app`

### Seller App Frontend

1. **Vercel'da yangi project yaratish:**
   - Project Name: `seller-app-frontend`
   - GitHub repo'ni ulash (bir xil monorepo)
   - Root Directory: `seller-app/frontend`

2. **Build Settings:**
   - Build Command: (yo'q - static files)
   - Output Directory: `.` (root)
   - Install Command: (yo'q)

3. **vercel.json konfiguratsiyasi:**
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

4. **Deploy:**
   - Vercel avtomatik `main` branch'dan deploy qiladi
   - Frontend URL: `https://seller-app-frontend.vercel.app`

**Muhim:** Ikkala frontend alohida project sifatida deploy qilinadi, lekin bir xil repository'dan.

## Git Workflow

### Branch Strategy

- `main` - Production (ikkala loyiha)
- `develop` - Development (ikkala loyiha)
- `feature/amazing-store-*` - Amazing Store features
- `feature/seller-app-*` - Seller App features
- `feature/shared-*` - Umumiy o'zgarishlar (database migrations)

### Git Commands

```bash
# Amazing Store o'zgarishlari
git checkout -b feature/amazing-store-new-feature
git add amazing-store/
git commit -m "feat(amazing-store): new feature"
git push origin feature/amazing-store-new-feature

# Seller App o'zgarishlari
git checkout -b feature/seller-app-new-feature
git add seller-app/
git commit -m "feat(seller-app): new feature"
git push origin feature/seller-app-new-feature

# Umumiy o'zgarishlar (database migrations)
git checkout -b feature/shared-database-migration
git add amazing-store/backend/migrations/
git commit -m "feat(database): new migration"
git push origin feature/shared-database-migration
```

### Deployment

- `main` branch → Production (Railway + Vercel avtomatik deploy)
- `develop` branch → Staging (agar kerak bo'lsa)

## Environment Variables

### Railway (Backend)

#### Amazing Store Backend
- `DATABASE_URL` - Shared PostgreSQL database
- `FRONTEND_URL` - Amazing Store Vercel URL
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (agar kerak bo'lsa)
- `PORT` - Railway avtomatik assign qiladi

#### Seller App Backend
- `DATABASE_URL` - Shared PostgreSQL database (bir xil)
- `FRONTEND_URL` - Seller App Vercel URL
- `PORT` - Railway avtomatik assign qiladi

### Vercel (Frontend)

- Environment variables kerak emas (static files)
- API proxy `vercel.json` orqali sozlanadi

## Troubleshooting

### Database Connection Issues

Agar database connection muammosi bo'lsa:

1. **Connection pool limitini tekshiring:**
   - Amazing Store: `max: 15`
   - Seller App: `max: 15`
   - Jami: 30 (database limitidan kamroq)

2. **DATABASE_URL ni tekshiring:**
   - Ikkala backend bir xil `DATABASE_URL` dan foydalanadi
   - Railway'da database service'dan oling

3. **Connection timeout:**
   - `idleTimeoutMillis: 30000` (30 soniya)
   - Agar kerak bo'lsa, oshirish mumkin

### CORS Issues

Agar CORS muammosi bo'lsa:

1. **Backend CORS sozlamalarini tekshiring:**
   - Amazing Store: `allowedOrigins` array'da Vercel URL bor
   - Seller App: CORS sozlamalari to'g'ri

2. **Vercel proxy sozlamalarini tekshiring:**
   - `vercel.json` faylida to'g'ri backend URL

### Deployment Issues

1. **Railway deployment:**
   - Root directory to'g'ri sozlanganligini tekshiring
   - Build va start command'lar to'g'ri
   - Environment variables to'g'ri

2. **Vercel deployment:**
   - Root directory to'g'ri sozlanganligini tekshiring
   - `vercel.json` fayli mavjud va to'g'ri
   - Build settings to'g'ri

## Monitoring

### Railway

- Logs: Railway dashboard'dan ko'rish mumkin
- Metrics: CPU, Memory, Network
- Alerts: Environment variables o'zgarishlari

### Vercel

- Logs: Vercel dashboard'dan ko'rish mumkin
- Analytics: Traffic, Performance
- Alerts: Deployment failures

## Best Practices

1. **Database:**
   - Migration'lar bir joyda (`amazing-store/backend/migrations/`)
   - Connection pool'ni optimallashtirish
   - Regular backups

2. **Deployment:**
   - `main` branch'ga merge qilishdan oldin test qiling
   - Environment variables'ni to'g'ri sozlang
   - Monitoring'ni yoqing

3. **Git:**
   - Feature branch'lar ishlatish
   - Commit message'lar aniq bo'lsin
   - Code review qilish

4. **Security:**
   - Environment variables'ni secret sifatida saqlash
   - CORS sozlamalarini to'g'ri qilish
   - Rate limiting yoqilgan

## Support

Agar muammo bo'lsa:
1. Logs'ni tekshiring (Railway va Vercel)
2. Environment variables'ni tekshiring
3. Database connection'ni tekshiring
4. CORS sozlamalarini tekshiring

