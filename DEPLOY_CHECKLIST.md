# Deployment Checklist

## Pre-Deployment Checks

### Amazing Store Backend (Railway)

- [x] Database connection pool optimallashtirilgan (`max: 15`)
- [x] Server.js to'g'ri konfiguratsiyalangan
- [x] Routes mavjud va ishlaydi
- [x] CORS sozlamalari to'g'ri
- [x] Environment variables dokumentatsiyasi
- [ ] Railway'da service yaratish
- [ ] Environment variables o'rnatish
- [ ] Database connection test qilish

### Amazing Store Frontend (Vercel)

- [x] vercel.json mavjud va to'g'ri
- [x] Static files tayyor
- [ ] Vercel'da project yaratish
- [ ] Root directory sozlash (`amazing-store/frontend`)
- [ ] API proxy URL'ni yangilash (Railway backend URL)

### Seller App Backend (Railway)

- [x] Database connection pool optimallashtirilgan (`max: 15`)
- [x] Server.js to'g'ri konfiguratsiyalangan
- [x] Test route mavjud (`/api/seller/test`)
- [x] CORS sozlamalari to'g'ri
- [ ] Routes yaratish (keyinroq)
- [ ] Railway'da service yaratish
- [ ] Environment variables o'rnatish
- [ ] Database connection test qilish

### Seller App Frontend (Vercel)

- [x] vercel.json mavjud va to'g'ri
- [x] Static files tayyor
- [ ] Vercel'da project yaratish
- [ ] Root directory sozlash (`seller-app/frontend`)
- [ ] API proxy URL'ni yangilash (Railway backend URL)

## Deployment Steps

### 1. Railway - Amazing Store Backend

1. Railway dashboard'ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. Repository'ni tanlang
4. Service yaratish:
   - **Service Name:** `amazing-store-backend`
   - **Root Directory:** `amazing-store/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Environment Variables:
   ```
   DATABASE_URL=postgresql://... (shared database)
   FRONTEND_URL=https://amazing-store-frontend.vercel.app
   PORT=3000 (Railway avtomatik)
   ```
6. Deploy

### 2. Vercel - Amazing Store Frontend

1. Vercel dashboard'ga kiring
2. "Add New Project" → GitHub repo'ni tanlang
3. Project sozlamalari:
   - **Project Name:** `amazing-store-frontend`
   - **Root Directory:** `amazing-store/frontend`
   - **Build Command:** (yo'q - static files)
   - **Output Directory:** `.` (root)
4. `vercel.json` faylida Railway backend URL'ni yangilash:
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
5. Deploy

### 3. Railway - Seller App Backend

1. Railway dashboard'ga kiring
2. "New Service" → "Deploy from GitHub repo"
3. Bir xil repository'ni tanlang
4. Service yaratish:
   - **Service Name:** `seller-app-backend`
   - **Root Directory:** `seller-app/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Environment Variables:
   ```
   DATABASE_URL=postgresql://... (bir xil shared database)
   FRONTEND_URL=https://seller-app-frontend.vercel.app
   PORT=3001 (Railway avtomatik)
   ```
6. Deploy

### 4. Vercel - Seller App Frontend

1. Vercel dashboard'ga kiring
2. "Add New Project" → GitHub repo'ni tanlang (bir xil repo)
3. Project sozlamalari:
   - **Project Name:** `seller-app-frontend`
   - **Root Directory:** `seller-app/frontend`
   - **Build Command:** (yo'q - static files)
   - **Output Directory:** `.` (root)
4. `vercel.json` faylida Railway backend URL'ni yangilash:
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
5. Deploy

## Post-Deployment Checks

### Amazing Store

- [ ] Backend ishlayaptimi? (`https://amazing-store-backend.up.railway.app/api/banners`)
- [ ] Frontend ishlayaptimi? (`https://amazing-store-frontend.vercel.app`)
- [ ] API proxy ishlayaptimi? (Frontend'dan API so'rovlar)
- [ ] Database connection ishlayaptimi?
- [ ] CORS ishlayaptimi?

### Seller App

- [ ] Backend ishlayaptimi? (`https://seller-app-backend.up.railway.app/api/seller/test`)
- [ ] Frontend ishlayaptimi? (`https://seller-app-frontend.vercel.app`)
- [ ] API proxy ishlayaptimi? (Frontend'dan API so'rovlar)
- [ ] Database connection ishlayaptimi?
- [ ] CORS ishlayaptimi?

## Troubleshooting

### Backend xatoliklari

1. **Database connection xatosi:**
   - `DATABASE_URL` to'g'ri ekanligini tekshiring
   - Railway'da database service'ni tekshiring
   - Connection pool limitini tekshiring

2. **Routes xatosi:**
   - Routes fayllari mavjudligini tekshiring
   - Import qilingan route'lar to'g'ri ekanligini tekshiring

3. **Port xatosi:**
   - Railway avtomatik port assign qiladi
   - `PORT` environment variable'ni o'rnatmang

### Frontend xatoliklari

1. **API proxy xatosi:**
   - `vercel.json` faylida backend URL to'g'ri ekanligini tekshiring
   - Railway backend URL'ni tekshiring

2. **CORS xatosi:**
   - Backend CORS sozlamalarini tekshiring
   - Vercel frontend URL backend'da allowed origins'da borligini tekshiring

## Next Steps

Deploy qilingandan keyin:

1. Routes va services yaratish (Seller App backend)
2. Frontend API integratsiyasi
3. Testing
4. Monitoring sozlash

