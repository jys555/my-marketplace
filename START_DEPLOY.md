# 🚀 Deployment Boshlash

## Tezkor Qadamlar

### 1️⃣ GitHub Repository

```bash
cd my-marketplace
git init
git add .
git commit -m "Initial commit: Monorepo with Amazing Store and Seller App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-marketplace.git
git push -u origin main
```

**YOUR_USERNAME** ni o'z GitHub username'ingiz bilan almashtiring.

---

### 2️⃣ Railway - Database

1. https://railway.app → **New Project** → **Empty Project**
2. **Add Service** → **Database** → **PostgreSQL**
3. Database yaratiladi
4. **Variables** → `DATABASE_URL` ni **COPY** qiling va saqlang

**Muhim:** Bu URL'ni keyingi qadamlarda ishlatamiz!

---

### 3️⃣ Railway - Amazing Store Backend

1. Railway dashboard'da **New Service** → **Deploy from GitHub repo**
2. `my-marketplace` repository'ni tanlang
3. **Settings** → **Name:** `amazing-store-backend`
4. **Settings** → **Root Directory:** `amazing-store/backend`
5. **Variables** → **New Variable:**
   - Key: `DATABASE_URL`
   - Value: (2-qadamda olingan DATABASE_URL)
6. **Variables** → **New Variable:**
   - Key: `FRONTEND_URL`
   - Value: `https://amazing-store-frontend.vercel.app` (keyinroq yangilanadi)
7. Deploy bosiladi (avtomatik)
8. Deploy tugagandan keyin **Settings** → **Generate Domain** → URL oling

**URL:** `https://amazing-store-backend.up.railway.app`

**Test:** Browser'da oching: `https://amazing-store-backend.up.railway.app/api/banners`

---

### 4️⃣ Vercel - Amazing Store Frontend

1. https://vercel.com → **Add New Project**
2. GitHub account'ni ulash (agar ulashmagan bo'lsa)
3. `my-marketplace` repository'ni tanlang → **Import**
4. **Project Name:** `amazing-store-frontend`
5. **⚙️ Configure Project:**
   - **Root Directory:** `amazing-store/frontend`
   - **Framework Preset:** Other
   - **Build Command:** (bo'sh)
   - **Output Directory:** `.`
6. **Deploy** bosish
7. Deploy tugagandan keyin URL oling

**URL:** `https://amazing-store-frontend.vercel.app`

**Keyin:** `amazing-store/frontend/vercel.json` faylida Railway backend URL'ni yangilang va GitHub'ga push qiling.

---

### 5️⃣ Railway - Seller App Backend

1. Railway dashboard'da (bir xil project'da) **New Service** → **Deploy from GitHub repo**
2. `my-marketplace` repository'ni tanlang (bir xil repo)
3. **Settings** → **Name:** `seller-app-backend`
4. **Settings** → **Root Directory:** `seller-app/backend`
5. **Variables** → **New Variable:**
   - Key: `DATABASE_URL`
   - Value: (2-qadamda olingan DATABASE_URL - **bir xil**)
6. **Variables** → **New Variable:**
   - Key: `FRONTEND_URL`
   - Value: `https://seller-app-frontend.vercel.app` (keyinroq yangilanadi)
7. Deploy bosiladi (avtomatik)
8. Deploy tugagandan keyin **Settings** → **Generate Domain** → URL oling

**URL:** `https://seller-app-backend.up.railway.app`

**Test:** Browser'da oching: `https://seller-app-backend.up.railway.app/api/seller/test`

---

### 6️⃣ Vercel - Seller App Frontend

1. Vercel dashboard'da **Add New Project**
2. `my-marketplace` repository'ni tanlang (bir xil repo) → **Import**
3. **Project Name:** `seller-app-frontend`
4. **⚙️ Configure Project:**
   - **Root Directory:** `seller-app/frontend`
   - **Framework Preset:** Other
   - **Build Command:** (bo'sh)
   - **Output Directory:** `.`
5. **Deploy** bosish
6. Deploy tugagandan keyin URL oling

**URL:** `https://seller-app-frontend.vercel.app`

**Keyin:** `seller-app/frontend/vercel.json` faylida Railway backend URL'ni yangilang va GitHub'ga push qiling.

---

### 7️⃣ Environment Variables Yangilash

#### Amazing Store Backend (Railway):
- `FRONTEND_URL` → `https://amazing-store-frontend.vercel.app`

#### Seller App Backend (Railway):
- `FRONTEND_URL` → `https://seller-app-frontend.vercel.app`

---

## ✅ Test Qilish

### Amazing Store:
- Backend: https://amazing-store-backend.up.railway.app/api/banners
- Frontend: https://amazing-store-frontend.vercel.app

### Seller App:
- Backend: https://seller-app-backend.up.railway.app/api/seller/test
- Frontend: https://seller-app-frontend.vercel.app

---

## 📝 Eslatmalar

1. **Database:** Ikkala backend bir xil `DATABASE_URL` dan foydalanadi
2. **Connection Pool:** Amazing Store (15), Seller App (15) - jami 30
3. **CORS:** Backend'da frontend URL'lar allowed origins'da
4. **Vercel Proxy:** `vercel.json` faylida backend URL'lar to'g'ri

---

## 🆘 Muammo bo'lsa

1. **Railway Logs:** Service → **Deployments** → **View Logs**
2. **Vercel Logs:** Project → **Deployments** → **View Function Logs**
3. **Database:** Railway → Database → **Connect** → Connection string'ni tekshiring

Batafsil: [DEPLOY_STEPS.md](DEPLOY_STEPS.md)

