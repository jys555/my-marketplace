# 🚀 CI/CD Pipeline Setup Guide

## ✅ GitHub Actions Workflows

### 1. Seller App Backend CI (`.github/workflows/seller-app-backend.yml`)

**Triggers:**
- Push to `main` or `develop` branches (when `seller-app/backend/**` changes)
- Pull requests to `main` or `develop` branches

**Jobs:**
- ✅ **Test:** Runs unit tests on Node.js 18.x and 20.x
- ✅ **Lint:** Runs ESLint and Prettier checks
- ✅ **Build:** Builds the project (after tests and lint pass)

**Coverage:** Uploads coverage reports to Codecov (optional)

---

### 2. Amazing Store Backend CI (`.github/workflows/amazing-store-backend.yml`)

**Triggers:**
- Push to `main` or `develop` branches (when `amazing store/backend/**` changes)
- Pull requests to `main` or `develop` branches

**Jobs:**
- ✅ **Test:** Runs unit tests on Node.js 18.x and 20.x
- ✅ **Lint:** Runs ESLint and Prettier checks
- ✅ **Build:** Builds the project (after tests and lint pass)

**Coverage:** Uploads coverage reports to Codecov (optional)

---

### 3. Main CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Purpose:** Orchestrates all CI workflows

---

### 4. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger (`workflow_dispatch`)

**Purpose:** Deployment notification (Railway/Vercel handle actual deployment via GitHub integration)

---

## 🔧 Setup Instructions

### Step 1: GitHub Repository Settings

1. **Enable GitHub Actions:**
   - Go to repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

2. **Set up Secrets (if needed):**
   - Go to Settings → Secrets and variables → Actions
   - Add secrets if needed (e.g., `DATABASE_URL` for tests, API keys, etc.)

---

### Step 2: Railway GitHub Integration (Backend)

1. **Connect GitHub to Railway:**
   - Go to Railway dashboard
   - Create new project or select existing project
   - Click "Connect GitHub Repo"
   - Select your repository

2. **Configure Services:**

   **Seller App Backend:**
   - Service name: `seller-app-backend`
   - Root directory: `seller-app/backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Branch: `main` (auto-deploy on push)

   **Amazing Store Backend:**
   - Service name: `amazing-store-backend`
   - Root directory: `amazing store/backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Branch: `main` (auto-deploy on push)

3. **Environment Variables:**
   - Set `DATABASE_URL` (Railway PostgreSQL)
   - Set `PORT` (auto-set by Railway)
   - Set `FRONTEND_URL` (Vercel frontend URL)
   - Set `TELEGRAM_BOT_TOKEN` (if using bot)

---

### Step 3: Vercel GitHub Integration (Frontend)

1. **Connect GitHub to Vercel:**
   - Go to Vercel dashboard
   - Click "Add New Project"
   - Import GitHub repository

2. **Configure Projects:**

   **Seller App Frontend:**
   - Project name: `seller-app-frontend`
   - Root directory: `seller-app/frontend`
   - Framework: Other
   - Build command: (leave empty - static files)
   - Output directory: `.`
   - Branch: `main` (auto-deploy on push)

   **Amazing Store Frontend:**
   - Project name: `amazing-store-frontend`
   - Root directory: `amazing store/frontend`
   - Framework: Other
   - Build command: (leave empty - static files)
   - Output directory: `.`
   - Branch: `main` (auto-deploy on push)

3. **Environment Variables:**
   - Set `API_URL` (Railway backend URL)

---

## ✅ Testing CI/CD

### Test Workflow Locally

```bash
# Install act (GitHub Actions local runner)
# macOS: brew install act
# Linux: See https://github.com/nektos/act

# Test workflow locally
act -j test -W .github/workflows/seller-app-backend.yml
```

### Test on GitHub

1. **Create a test branch:**
   ```bash
   git checkout -b test/ci-cd
   ```

2. **Make a small change:**
   ```bash
   # Make a small change in seller-app/backend
   echo "# Test" >> seller-app/backend/README.md
   git add .
   git commit -m "test: CI/CD workflow"
   git push origin test/ci-cd
   ```

3. **Create Pull Request:**
   - Go to GitHub → Pull Requests → New Pull Request
   - Select `test/ci-cd` → `develop`
   - Check Actions tab to see CI running

4. **Verify:**
   - ✅ Tests run
   - ✅ Lint checks pass
   - ✅ Build succeeds

---

## 📊 Workflow Status

### View Workflow Runs

- Go to GitHub → Actions tab
- See all workflow runs
- Click on a run to see detailed logs

### Workflow Badges (Optional)

Add to README.md:

```markdown
![CI](https://github.com/your-username/my-marketplace/workflows/CI%20-%20All%20Projects/badge.svg)
```

---

## 🔍 Troubleshooting

### Issue: Tests Fail in CI

**Solution:**
- Check test database setup
- Verify environment variables
- Check test files for hardcoded values

### Issue: Lint Fails

**Solution:**
- Run `npm run lint:fix` locally
- Commit fixed files
- Or update ESLint config if needed

### Issue: Build Fails

**Solution:**
- Check build script in `package.json`
- Verify all dependencies are in `package.json`
- Check for missing files

### Issue: Railway Not Deploying

**Solution:**
- Check Railway GitHub integration
- Verify service root directory
- Check Railway logs
- Verify branch settings (should be `main`)

### Issue: Vercel Not Deploying

**Solution:**
- Check Vercel GitHub integration
- Verify project root directory
- Check Vercel build logs
- Verify branch settings

---

## 🎯 Best Practices

1. **Always run tests locally before pushing:**
   ```bash
   npm test
   npm run lint
   ```

2. **Use meaningful commit messages:**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "test: add tests"
   ```

3. **Keep workflows fast:**
   - Use caching (already configured)
   - Run tests in parallel (matrix strategy)
   - Skip unnecessary steps

4. **Monitor CI/CD:**
   - Check Actions tab regularly
   - Fix failing tests immediately
   - Keep dependencies updated

---

## 📝 Next Steps

1. ✅ CI/CD workflows created
2. ⏭️ Connect Railway (backend deployment)
3. ⏭️ Connect Vercel (frontend deployment)
4. ⏭️ Test workflows on GitHub
5. ⏭️ Monitor deployments

---

**Status:** ✅ CI/CD Pipeline setup complete! 🚀
