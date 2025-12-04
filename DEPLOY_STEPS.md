# Deployment Steps - Step by Step

## 1. GitHub Repository

### Avval kodlarni GitHub'ga push qiling:

```bash
cd my-marketplace
git init
git add .
git commit -m "Initial commit: Monorepo with Amazing Store and Seller App"
git branch -M main
git remote add origin https://github.com/yourusername/my-marketplace.git
git push -u origin main
```

**Muhim:** GitHub repository URL'ni oling va keyingi qadamlarda ishlating.

---

## 2. Railway - Database (Agar mavjud bo'lmasa)

### PostgreSQL Database yaratish:

1. Railway dashboard'ga kiring: https://railway.app
2. "New Project" → "Empty Project"
3. "Add Service" → "Database" → "PostgreSQL"
4. Database yaratiladi
5. **Variables** → `DATABASE_URL` ni oling va saqlang

**Muhim:** Bu `DATABASE_URL` ni keyingi qadamlarda ishlatamiz.

---

## 3. Railway - Amazing Store Backend

### Service yaratish:

1. Railway dashboard'da "New Service" → "Deploy from GitHub repo"
2. `my-marketplace` repository'ni tanlang
3. Service yaratiladi

### Service sozlamalari:

1. **Settings** → **Name:** `amazing-store-backend`
2. **Settings** → **Root Directory:** `amazing-store/backend`
3. **Settings** → **Build Command:** `npm install` (default)
4. **Settings** → **Start Command:** `npm start` (default)

### Environment Variables:

**Variables** bo'limiga quyidagilarni qo'shing:

```
DATABASE_URL=postgresql://... (2-qadamda olingan)
FRONTEND_URL=https://amazing-store-frontend.vercel.app
PORT=3000 (Railway avtomatik assign qiladi, lekin qo'shish mumkin)
```

### Deploy:

- Railway avtomatik deploy qiladi
- Deploy tugagandan keyin **Settings** → **Generate Domain** bosib URL oling
- URL: `https://amazing-store-backend.up.railway.app`

**Test:** `https://amazing-store-backend.up.railway.app/api/banners`

---

## 4. Vercel - Amazing Store Frontend

### Project yaratish:

1. Vercel dashboard'ga kiring: https://vercel.com
2. "Add New Project" → GitHub account'ni ulash (agar ulashmagan bo'lsa)
3. `my-marketplace` repository'ni tanlang
4. "Import" bosish

### Project sozlamalari:

1. **Project Name:** `amazing-store-frontend`
2. **Framework Preset:** Other
3. **Root Directory:** `amazing-store/frontend` (⚙️ Configure Project)
4. **Build Command:** (bo'sh qoldiring - static files)
5. **Output Directory:** `.` (root)
6. **Install Command:** (bo'sh qoldiring)

### Deploy:

- "Deploy" bosish
- Deploy tugagandan keyin URL oling
- URL: `https://amazing-store-frontend.vercel.app`

### vercel.json yangilash:

Deploy qilingandan keyin, `amazing-store/frontend/vercel.json` faylida Railway backend URL'ni yangilang:

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

Keyin GitHub'ga push qiling va Vercel avtomatik qayta deploy qiladi.

---

## 5. Railway - Seller App Backend

### Service yaratish:

1. Railway dashboard'da (bir xil project'da) "New Service" → "Deploy from GitHub repo"
2. `my-marketplace` repository'ni tanlang (bir xil repo)
3. Service yaratiladi

### Service sozlamalari:

1. **Settings** → **Name:** `seller-app-backend`
2. **Settings** → **Root Directory:** `seller-app/backend`
3. **Settings** → **Build Command:** `npm install` (default)
4. **Settings** → **Start Command:** `npm start` (default)

### Environment Variables:

**Variables** bo'limiga quyidagilarni qo'shing:

```
DATABASE_URL=postgresql://... (2-qadamda olingan - bir xil database)
FRONTEND_URL=https://seller-app-frontend.vercel.app
PORT=3001 (Railway avtomatik assign qiladi)
```

### Deploy:

- Railway avtomatik deploy qiladi
- Deploy tugagandan keyin **Settings** → **Generate Domain** bosib URL oling
- URL: `https://seller-app-backend.up.railway.app`

**Test:** `https://seller-app-backend.up.railway.app/api/seller/test`

---

## 6. Vercel - Seller App Frontend

### Project yaratish:

1. Vercel dashboard'da "Add New Project" → GitHub repo'ni tanlang (bir xil repo)
2. "Import" bosish

### Project sozlamalari:

1. **Project Name:** `seller-app-frontend`
2. **Framework Preset:** Other
3. **Root Directory:** `seller-app/frontend` (⚙️ Configure Project)
4. **Build Command:** (bo'sh qoldiring - static files)
5. **Output Directory:** `.` (root)
6. **Install Command:** (bo'sh qoldiring)

### Deploy:

- "Deploy" bosish
- Deploy tugagandan keyin URL oling
- URL: `https://seller-app-frontend.vercel.app`

### vercel.json yangilash:

Deploy qilingandan keyin, `seller-app/frontend/vercel.json` faylida Railway backend URL'ni yangilang:

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

Keyin GitHub'ga push qiling va Vercel avtomatik qayta deploy qiladi.

---

## 7. Environment Variables Yangilash

### Amazing Store Backend (Railway):

Deploy qilingandan keyin, Railway dashboard'da:

1. `amazing-store-backend` service'ni oching
2. **Variables** → `FRONTEND_URL` ni yangilang:
   ```
   FRONTEND_URL=https://amazing-store-frontend.vercel.app
   ```
3. Service avtomatik restart bo'ladi

### Seller App Backend (Railway):

Deploy qilingandan keyin, Railway dashboard'da:

1. `seller-app-backend` service'ni oching
2. **Variables** → `FRONTEND_URL` ni yangilang:
   ```
   FRONTEND_URL=https://seller-app-frontend.vercel.app
   ```
3. Service avtomatik restart bo'ladi

---

## 8. Test Qilish

### Amazing Store:

1. **Backend:** `https://amazing-store-backend.up.railway.app/api/banners`
   - JSON response kelishi kerak
2. **Frontend:** `https://amazing-store-frontend.vercel.app`
   - Sahifa ochilishi kerak
3. **API Proxy:** Frontend'dan API so'rovlar ishlashi kerak

### Seller App:

1. **Backend:** `https://seller-app-backend.up.railway.app/api/seller/test`
   - `{"message": "Seller App API is working!"}` kelishi kerak
2. **Frontend:** `https://seller-app-frontend.vercel.app`
   - Dashboard ochilishi kerak
3. **API Proxy:** Frontend'dan API so'rovlar ishlashi kerak

---

## Troubleshooting

### Backend ishlamayapti:

1. Railway logs'ni tekshiring: **Deployments** → **View Logs**
2. Environment variables to'g'ri ekanligini tekshiring
3. Database connection'ni tekshiring

### Frontend API proxy ishlamayapti:

1. `vercel.json` faylida backend URL to'g'ri ekanligini tekshiring
2. Vercel'da qayta deploy qiling
3. Browser console'da xatolarni tekshiring

### CORS xatosi:

1. Backend CORS sozlamalarini tekshiring
2. Frontend URL backend'da allowed origins'da borligini tekshiring
3. Environment variable `FRONTEND_URL` to'g'ri ekanligini tekshiring

---

## Keyingi Qadamlar

Deploy qilingandan keyin:

1. ✅ Routes va services yaratish (Seller App backend)
2. ✅ Frontend API integratsiyasi
3. ✅ Testing
4. ✅ Monitoring sozlash

