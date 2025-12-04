# Contributing Guide

## Git Workflow

### Branch Strategy

- `main` - Production branch (ikkala loyiha)
- `develop` - Development branch (ikkala loyiha)
- `feature/amazing-store-*` - Amazing Store features
- `feature/seller-app-*` - Seller App features
- `feature/shared-*` - Umumiy o'zgarishlar (database migrations, utilities)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - Yangi funksiya
- `fix` - Bug fix
- `docs` - Dokumentatsiya
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `test` - Test qo'shish
- `chore` - Build process, dependencies

**Scopes:**
- `amazing-store` - Amazing Store loyihasi
- `seller-app` - Seller App loyihasi
- `database` - Database migrations
- `shared` - Umumiy utilities

**Examples:**
```bash
feat(amazing-store): add product search functionality
fix(seller-app): fix inventory calculation bug
docs(database): update migration documentation
refactor(shared): optimize database connection pool
```

### Pull Request Process

1. **Feature branch yaratish:**
   ```bash
   git checkout -b feature/amazing-store-new-feature
   ```

2. **O'zgarishlarni commit qilish:**
   ```bash
   git add amazing-store/
   git commit -m "feat(amazing-store): new feature"
   ```

3. **Push qilish:**
   ```bash
   git push origin feature/amazing-store-new-feature
   ```

4. **Pull Request yaratish:**
   - GitHub'da PR yaratish
   - Description'da o'zgarishlarni tushuntirish
   - Review'ga yuborish

5. **Merge qilish:**
   - Code review'dan keyin merge qilish
   - `main` branch'ga merge qilinganidan keyin avtomatik deploy

## Code Style

### JavaScript

- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Yes
- **Trailing commas:** Yes (objects, arrays)

### Naming Conventions

- **Variables:** camelCase (`userName`, `productId`)
- **Constants:** UPPER_SNAKE_CASE (`DATABASE_URL`, `MAX_CONNECTIONS`)
- **Functions:** camelCase (`getProducts`, `updateInventory`)
- **Classes:** PascalCase (`ProductManager`, `InventoryService`)

### File Structure

```
amazing-store/
├── backend/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── migrations/      # Database migrations
└── frontend/
    ├── pages/           # Page-specific files
    └── assets/          # Static assets
```

## Database Migrations

### Migration Yaratish

1. **Migration fayl yaratish:**
   ```bash
   # amazing-store/backend/migrations/003_new_feature.sql
   ```

2. **Migration yozish:**
   ```sql
   -- Migration description
   CREATE TABLE IF NOT EXISTS new_table (
       id SERIAL PRIMARY KEY,
       ...
   );
   ```

3. **Migration'ni test qilish:**
   ```bash
   cd amazing-store/backend
   npm run dev
   # Migration avtomatik ishga tushadi
   ```

4. **Commit qilish:**
   ```bash
   git add amazing-store/backend/migrations/003_new_feature.sql
   git commit -m "feat(database): add new_table migration"
   ```

### Migration Best Practices

- Har bir migration'da `IF NOT EXISTS` ishlatish
- Index'lar qo'shish (performance uchun)
- Rollback script yozish (agar kerak bo'lsa)
- Migration'ni test qilish (local'da)

## Testing

### Local Testing

1. **Backend test qilish:**
   ```bash
   cd amazing-store/backend
   npm run dev
   # API endpoint'larni test qilish
   ```

2. **Frontend test qilish:**
   ```bash
   cd amazing-store/frontend
   # Browser'da ochish va test qilish
   ```

3. **Database test qilish:**
   - Local database'da migration'larni test qilish
   - Connection pool'ni test qilish

## Deployment Checklist

### Before Deploying

- [ ] Code review qilingan
- [ ] Local'da test qilingan
- [ ] Migration'lar test qilingan
- [ ] Environment variables to'g'ri
- [ ] Documentation yangilangan

### After Deploying

- [ ] Railway logs'ni tekshirish
- [ ] Vercel deployment'ni tekshirish
- [ ] API endpoint'larni test qilish
- [ ] Frontend'ni test qilish
- [ ] Database connection'ni tekshirish

## Questions?

Agar savol bo'lsa:
1. GitHub Issues ochish
2. Documentation'ni tekshirish
3. Code review so'rash

