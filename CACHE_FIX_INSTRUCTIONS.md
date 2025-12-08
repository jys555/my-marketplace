# Service Worker Cache Tozalash - Qo'llanma

## Muammo
GitHub'ga deploy qilingan va Railway'da yuklangan, lekin Mini App'da o'zgarishlar ko'rinmayapti.

## Yechim

### 1. Service Worker Versiyasi Yangilandi
- Versiya: `v2.0.0` → `v3.0.0`
- Cache strategiyasi: Network First (HTML fayllar uchun)
- Avtomatik yangilanish: 60 soniyada bir marta tekshiradi

### 2. Cache Tozalash (Foydalanuvchi tomonidan)

#### Variant A: Telegram Mini App'da
1. Mini App'ni yoping
2. Telegram'da bot'ni qayta oching
3. Mini App'ni qayta oching

#### Variant B: Browser Developer Tools (Agar desktop'da ochilgan bo'lsa)
1. F12 bosib Developer Tools'ni oching
2. Application tab'ga o'ting
3. Service Workers bo'limida "Unregister" tugmasini bosing
4. Clear storage bo'limida "Clear site data" tugmasini bosing
5. Sahifani qayta yuklang (Ctrl+Shift+R)

#### Variant C: Service Worker avtomatik yangilanishi
- Service Worker endi avtomatik yangilanadi
- Yangi versiya topilsa, sahifa avtomatik reload bo'ladi
- 60 soniyada bir marta yangi versiyani tekshiradi

### 3. Deploy Qilishdan Keyin

1. **GitHub'ga push qiling:**
   ```bash
   git add .
   git commit -m "Update: Service Worker v3.0.0 - Fix cache issues"
   git push origin main
   ```

2. **Vercel avtomatik deploy qiladi** (agar GitHub integration sozlangan bo'lsa)

3. **Railway avtomatik deploy qiladi** (agar GitHub integration sozlangan bo'lsa)

4. **Kutish:** 1-2 daqiqa

5. **Mini App'ni qayta oching** va yangi versiya yuklanadi

## Tekshirish

1. Browser Console'da quyidagi log'larni ko'rasiz:
   - `✅ Service Worker registered: ...`
   - `[Service Worker] Installing...`
   - `[Service Worker] Activating...`
   - `[Service Worker] Deleting old cache: ...`

2. Agar yangi versiya topilsa:
   - `🔄 New Service Worker available, reloading...`
   - Sahifa avtomatik reload bo'ladi

## Qo'shimcha Ma'lumot

- Service Worker versiyasi: `v3.0.0`
- Cache nomi: `seller-app-v3.0.0`
- Eski cache'lar avtomatik o'chiriladi
- HTML fayllar har doim network'dan yuklanadi (yangilanishlar uchun)
- Boshqa resurslar cache'dan yuklanadi (tezlik uchun)

