# Railway Amazing Store Backend - Sozlash Tuzatishlari

## Muammo
Amazing Store backend service'ga yangilanishlar deploy qilinmayapti.

## Yechim

### 1. Railway Dashboard'da Service Sozlamalarini Tekshirish

1. Railway dashboard'ga kiring: https://railway.app
2. `my-marketplace` project'ni oching
3. `amazing-store-backend` service'ni tanlang
4. **Settings** tab'iga o'ting

### 2. Root Directory Tekshiruvi

**Settings** → **Root Directory** bo'limida quyidagilarni tekshiring:

✅ **To'g'ri:** `amazing store/backend` (bo'sh joy bilan!)
❌ **Noto'g'ri:** `amazing-store/backend` (tire bilan)

**Agar noto'g'ri bo'lsa:**
1. Root Directory'ni `amazing store/backend` ga o'zgartiring
2. "Save" bosib saqlang
3. Service avtomatik redeploy qiladi

### 3. GitHub Integration Tekshiruvi

**Settings** → **Source** bo'limida:

1. **Repository:** `jys555/my-marketplace` bo'lishi kerak
2. **Branch:** `main` bo'lishi kerak
3. **Auto Deploy:** ✅ Yoqilgan bo'lishi kerak

**Agar Auto Deploy o'chik bo'lsa:**
1. "Enable Auto Deploy" ni yoqing
2. Yoki manual "Redeploy" tugmasini bosing

### 4. Build va Start Command Tekshiruvi

**Settings** → **Deploy** bo'limida:

- **Build Command:** `npm install` (yoki bo'sh qoldirish mumkin)
- **Start Command:** `npm start`

### 5. Manual Redeploy

Agar yuqoridagi sozlamalar to'g'ri bo'lsa, lekin hali ham deploy qilinmasa:

1. **Deployments** tab'iga o'ting
2. "New Deployment" yoki "Redeploy" tugmasini bosing
3. "Deploy from GitHub" ni tanlang
4. `main` branch'ni tanlang
5. "Deploy" bosish

### 6. Environment Variables Tekshiruvi

**Settings** → **Variables** bo'limida quyidagilar bo'lishi kerak:

```
DATABASE_URL=postgresql://... (shared database)
FRONTEND_URL=https://amazing-store-frontend.vercel.app
PORT=3000 (optional, Railway avtomatik assign qiladi)
```

### 7. Logs Tekshiruvi

**Logs** tab'ida deploy jarayonini kuzatib boring:

- Build jarayoni muvaffaqiyatli bo'lishi kerak
- Start command ishga tushishi kerak
- Xatoliklar bo'lsa, ularni ko'ring

## Tekshirish

Deploy tugagandan keyin:

1. **Settings** → **Generate Domain** bosib URL oling
2. URL: `https://amazing-store-backend-production.up.railway.app`
3. Test: `https://amazing-store-backend-production.up.railway.app/api/banners`

Agar 200 OK qaytsa, deploy muvaffaqiyatli!

## Qo'shimcha Eslatmalar

- Railway monorepo'da root directory bo'sh joy bilan bo'lishi mumkin
- Papka nomi `amazing store` (bo'sh joy bilan), shuning uchun root directory ham `amazing store/backend` bo'lishi kerak
- Agar Railway bo'sh joy bilan ishlamasa, papka nomini `amazing-store` ga o'zgartirish kerak bo'ladi

