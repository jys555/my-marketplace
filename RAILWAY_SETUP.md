# Railway Setup Instructions

## Muammo
- Postgres servis offline
- seller-app-backend build failed (npm topilmayapti)
- amazing-store-backend build failed

## Yechim

### 1. Postgres Servisini Yoqish
1. Railway dashboard'ga kiring
2. `Postgres` servisini toping
3. "Start" yoki "Restart" tugmasini bosing

### 2. Service Root Directory'larini Sozlash

Railway dashboard'da har bir service uchun quyidagi Root Directory'larini sozlang:

#### seller-app-backend
- **Root Directory**: `seller-app/backend`
- **Build Command**: `npm install` (yoki railway.json'dagi buildCommand)
- **Start Command**: `npm start`

#### amazing-store-backend  
- **Root Directory**: `amazing store/backend`
- **Build Command**: `npm install` (yoki railway.json'dagi buildCommand)
- **Start Command**: `npm start`

### 3. Railway Dashboard'da Sozlash Qadamlari

Har bir service uchun:
1. Service'ga kiring
2. **Settings** tab'iga o'ting
3. **Root Directory** maydonini quyidagicha sozlang:
   - seller-app-backend: `seller-app/backend`
   - amazing-store-backend: `amazing store/backend`
4. **Deploy** tugmasini bosing

### 4. Environment Variables

Har bir service uchun quyidagi environment variable'lar sozlanganligini tekshiring:

- `DATABASE_URL` - Postgres connection string
- `PORT` - Server port (odatda Railway o'zi belgilaydi)
- Boshqa zaruriy o'zgaruvchilar

### 5. Qayta Deploy Qilish

Root Directory'lar sozlangandan keyin:
1. Har bir service'ni qayta deploy qiling
2. Build loglarini tekshiring - endi `npm: command not found` xatolik bo'lmasligi kerak

## Tekshirish

Deploy'dan keyin:
1. Build loglarida xatolik bo'lmasligi kerak
2. Service'lar "Running" holatida bo'lishi kerak
3. Frontend'lardan API so'rovlari muvaffaqiyatli ishlashi kerak
