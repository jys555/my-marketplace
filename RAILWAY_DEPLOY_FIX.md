# Railway Auto-Deploy Muammosi - Yechim

## 🔍 Muammo

Amazing Store service avtomatik deploy qilmayapti, lekin Seller App service avtomatik deploy qilmoqda.

## ✅ Yechimlar

### 1. Railway Dashboard'da Tekshirish

**Amazing Store Service sozlamalari:**

1. **Settings → Source:**
   - ✅ GitHub repository connected bo'lishi kerak
   - ✅ Branch: `main` yoki `develop`
   - ✅ Root Directory: `amazing store/backend` (MUHIM!)

2. **Settings → Deploy:**
   - ✅ Auto Deploy: **Enabled** bo'lishi kerak
   - ✅ Watch Paths: `amazing store/backend/**` (agar mavjud bo'lsa)

3. **Settings → Environment:**
   - ✅ Barcha environment variables to'g'ri sozlanganligi

### 2. Root Directory Muammosi

**Muammo:** Railway'da root directory noto'g'ri sozlangan bo'lishi mumkin.

**Yechim:**
- Railway Dashboard → Amazing Store Service → Settings → Source
- Root Directory: `amazing store/backend` (bo'shliq bilan!)
- Yoki: `amazing-store/backend` (agar Railway bo'shliqni qo'llab-quvvatlamasa)

### 3. GitHub Integration

**Tekshirish:**
1. Railway Dashboard → Project Settings → Integrations
2. GitHub integration enabled bo'lishi kerak
3. Repository to'g'ri tanlanganligi

### 4. Watch Patterns

**railway.json** faylida watchPatterns to'g'ri sozlangan:
```json
{
  "watchPatterns": [
    "**/*.js",
    "**/*.json",
    "package.json",
    "package-lock.json",
    "../database/migrations/**",
    "../../database/migrations/**"
  ]
}
```

**Eslatma:** Railway service root directory `amazing store/backend` bo'lsa, watchPatterns relative path'lar ishlatadi.

## 🔧 Amaliy Qadamlar

### Qadam 1: Railway Dashboard'da Tekshirish

1. Railway dashboard'ga kiring
2. Amazing Store service'ni oching
3. Settings → Source bo'limiga o'ting
4. Root Directory'ni tekshiring: `amazing store/backend`
5. Auto Deploy enabled bo'lishini tekshiring

### Qadam 2: GitHub Integration

1. Project Settings → Integrations
2. GitHub integration enabled bo'lishini tekshiring
3. Repository to'g'ri tanlanganligini tekshiring

### Qadam 3: Manual Deploy Test

1. Railway Dashboard → Amazing Store Service
2. Deployments → New Deployment
3. Manual deploy qiling
4. Xatoliklar bo'lsa, loglarni tekshiring

### Qadam 4: Watch Patterns Test

1. `amazing store/backend` ichida kichik o'zgarish qiling
2. Commit va push qiling
3. Railway avtomatik deploy qilishini kuzating

## 📊 Solishtirma: Seller App vs Amazing Store

| Xususiyat | Seller App | Amazing Store | Yechim |
|-----------|------------|---------------|--------|
| Root Directory | `seller-app/backend` | `amazing store/backend` | To'g'ri sozlash |
| Auto Deploy | ✅ Enabled | ❓ Tekshirish kerak | Dashboard'da enabled qilish |
| GitHub Integration | ✅ Connected | ❓ Tekshirish kerak | Integration'ni tekshirish |
| Watch Patterns | ✅ Ishlayapti | ❓ Tekshirish kerak | railway.json to'g'ri |

## 🎯 Keyingi Qadamlar

1. **Darhol:**
   - Railway Dashboard'da Amazing Store service sozlamalarini tekshirish
   - Root Directory: `amazing store/backend`
   - Auto Deploy: Enabled

2. **Tekshirish:**
   - GitHub integration enabledligi
   - Watch patterns to'g'riligi
   - Environment variables

3. **Test:**
   - Kichik o'zgarish qilish va push qilish
   - Auto-deploy ishlashini kuzatish

## ⚠️ Eslatmalar

- Railway bo'shliqli path'larni qo'llab-quvvatlaydi, lekin ba'zi hollarda muammo yaratishi mumkin
- Agar root directory muammosi bo'lsa, `amazing-store/backend` (tire bilan) ishlatish mumkin
- Watch patterns relative path'lar ishlatadi (service root directory'dan)
