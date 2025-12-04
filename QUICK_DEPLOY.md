# Quick Deployment Guide

## Deployment Qadamlari

### 1. GitHub Repository

Avval kodlarni GitHub'ga push qiling:

```bash
cd my-marketplace
git init
git add .
git commit -m "Initial commit: Monorepo structure"
git branch -M main
git remote add origin https://github.com/yourusername/my-marketplace.git
git push -u origin main
```

### 2. Railway - Amazing Store Backend

1. [Railway.app](https://railway.app) ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. `my-marketplace` repository'ni tanlang
4. "Add Service" → "Empty Service"
5. Service sozlamalari:
   - **Name:** `amazing-store-backend`
   - **Settings** → **Root Directory:** `amazing-store/backend`
   - **Settings** → **Build Command:** `npm install`
   - **Settings** → **Start Command:** `npm start`
6. **Variables** → Environment Variables qo'shing:
   ```
   DATABASE_URL=postgresql://... (shared database)
   FRONTEND_URL=https://amazing-store-frontend.vercel.app
   ```
7. Deploy bosiladi (avtomatik)

**URL:** `https://amazing-store-backend.up.railway.app`

### 3. Vercel - Amazing Store Frontend

1. [Vercel.com](https://vercel.com) ga kiring
2. "Add New Project" → GitHub repo'ni tanlang
3. Project sozlamalari:
   - **Project Name:** `amazing-store-frontend`
   - **Root Directory:** `amazing-store/frontend` (⚙️ Configure Project)
   - **Framework Preset:** Other
   - **Build Command:** (bo'sh qoldiring)
   - **Output Directory:** `.` (root)
4. **Deploy**

**URL:** `https://amazing-store-frontend.vercel.app`

5. Deploy qilingandan keyin, `vercel.json` faylida Railway backend URL'ni yangilang:
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
6. Qayta deploy qiling

### 4. Railway - Seller App Backend

1. Railway dashboard'da "New Service" → "Deploy from GitHub repo"
2. Bir xil `my-marketplace` repository'ni tanlang
3. Service sozlamalari:
   - **Name:** `seller-app-backend`
   - **Settings** → **Root Directory:** `seller-app/backend`
   - **Settings** → **Build Command:** `npm install`
   - **Settings** → **Start Command:** `npm start`
4. **Variables** → Environment Variables qo'shing:
   ```
   DATABASE_URL=postgresql://... (bir xil shared database)
   FRONTEND_URL=https://seller-app-frontend.vercel.app
   ```
5. Deploy

**URL:** `https://seller-app-backend.up.railway.app`

### 5. Vercel - Seller App Frontend

1. Vercel dashboard'da "Add New Project" → GitHub repo'ni tanlang (bir xil repo)
2. Project sozlamalari:
   - **Project Name:** `seller-app-frontend`
   - **Root Directory:** `seller-app/frontend` (⚙️ Configure Project)
   - **Framework Preset:** Other
   - **Build Command:** (bo'sh qoldiring)
   - **Output Directory:** `.` (root)
3. **Deploy**

**URL:** `https://seller-app-frontend.vercel.app`

4. Deploy qilingandan keyin, `vercel.json` faylida Railway backend URL'ni yangilang:
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
5. Qayta deploy qiling

### 6. Environment Variables Yangilash

#### Amazing Store Backend (Railway)
- `FRONTEND_URL` ni yangilang: `https://amazing-store-frontend.vercel.app`

#### Seller App Backend (Railway)
- `FRONTEND_URL` ni yangilang: `https://seller-app-frontend.vercel.app`

## Test Qilish

### Amazing Store
- Backend: `https://amazing-store-backend.up.railway.app/api/banners`
- Frontend: `https://amazing-store-frontend.vercel.app`

### Seller App
- Backend: `https://seller-app-backend.up.railway.app/api/seller/test`
- Frontend: `https://seller-app-frontend.vercel.app`

## Muhim Eslatmalar

1. **Database:** Ikkala backend bir xil `DATABASE_URL` dan foydalanadi
2. **Connection Pool:** Amazing Store (15), Seller App (15) - jami 30
3. **CORS:** Backend'da frontend URL'lar allowed origins'da bo'lishi kerak
4. **Vercel Proxy:** `vercel.json` faylida backend URL'lar to'g'ri bo'lishi kerak

## Keyingi Qadamlar

Deploy qilingandan keyin:
1. Routes va services yaratish (Seller App backend)
2. Frontend API integratsiyasi
3. Testing
4. Monitoring

