# 🚀 Deploy Commands - Barcha O'zgarishlar

## 📋 Deploy Qilish Qadamlar

### Step 1: Git Status Tekshirish

```bash
cd c:\Users\juman\Downloads\my-marketplace
git status
```

---

### Step 2: Barcha O'zgarishlarni Add Qilish

```bash
# Barcha o'zgarishlarni add qilish
git add .

# Yoki alohida add qilish
git add .github/
git add *.md
git add seller-app/backend/
git add "amazing store/backend/"
```

---

### Step 3: Commit Qilish

```bash
git commit -m "feat: add CI/CD pipeline, Swagger documentation, and complete project documentation

- Add GitHub Actions workflows for automated testing and linting
- Add Swagger API documentation for both backends  
- Add comprehensive Developer Guide
- Add CI/CD setup guide
- Update project documentation
- Complete all project phases (9/9)"
```

---

### Step 4: Push Qilish

```bash
# Main branch'ga push qilish
git push origin main

# Yoki develop branch bo'lsa
git push origin develop
```

---

## ✅ Deploy Natijasi

### Railway (Backend)
- Seller App Backend: Avtomatik deploy qilinadi
- Amazing Store Backend: Avtomatik deploy qilinadi

### Vercel (Frontend)
- Seller App Frontend: Avtomatik deploy qilinadi
- Amazing Store Frontend: Avtomatik deploy qilinadi

### GitHub Actions (CI/CD)
- Test workflows ishlaydi
- Lint workflows ishlaydi
- Build workflows ishlaydi

---

## 🔍 Deploy Tekshirish

### Railway Logs
```bash
# Railway CLI orqali
railway logs

# Yoki Railway dashboard'da
# Deployments → Latest deployment → Logs
```

### Vercel Logs
```bash
# Vercel CLI orqali
vercel logs

# Yoki Vercel dashboard'da
# Deployments → Latest deployment → Logs
```

### GitHub Actions
- GitHub → Actions tab
- Latest workflow run'ni tekshirish

---

**Status:** Deploy qilishga tayyor! 🚀
