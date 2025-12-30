# 👨‍💻 Developer Guide - My Marketplace

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Development Workflow](#development-workflow)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Code Quality](#code-quality)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**My Marketplace** is a monorepo containing two main applications:

### Amazing Store
- **Purpose:** E-commerce Telegram Mini App
- **Backend:** Express.js (Port 3000)
- **Frontend:** Vanilla JavaScript
- **Deployment:** Railway (Backend), Vercel (Frontend)

### Seller App
- **Purpose:** Multi-marketplace seller management system
- **Backend:** Express.js (Port 3001)
- **Frontend:** Vanilla JavaScript
- **Deployment:** Railway (Backend), Vercel (Frontend)

**Shared Database:** Both applications use the same PostgreSQL database.

---

## 🏗️ Architecture

### Monorepo Structure

```
my-marketplace/
├── amazing store/
│   ├── backend/          # Express.js API
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helpers, logger, db
│   │   ├── config/        # Swagger config
│   │   └── __tests__/     # Tests
│   └── frontend/         # Static HTML/CSS/JS
├── seller-app/
│   ├── backend/          # Express.js API
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helpers, logger, db
│   │   ├── config/       # Swagger config
│   │   └── __tests__/     # Tests
│   └── frontend/         # Static HTML/CSS/JS
└── database/
    └── migrations/       # Database migrations
```

### Technology Stack

**Backend:**
- Node.js 18+
- Express.js 4.x
- PostgreSQL (via `pg`)
- Winston (Logging)
- Swagger (API Documentation)

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5, CSS3
- Chart.js (Analytics)

**Development Tools:**
- ESLint (Code linting)
- Prettier (Code formatting)
- Jest (Testing)
- Supertest (API testing)

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js:** 18.x or higher
- **PostgreSQL:** 14.x or higher
- **npm:** 9.x or higher
- **Git:** Latest version

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd my-marketplace
```

### Step 2: Database Setup

1. **Create PostgreSQL Database:**

```bash
createdb my_marketplace
```

2. **Set Environment Variable:**

```bash
# .env file (create in each backend directory)
DATABASE_URL=postgresql://user:password@localhost:5432/my_marketplace
```

3. **Run Migrations:**

```bash
# Amazing Store Backend
cd "amazing store/backend"
node utils/initDb.js

# Seller App Backend
cd ../../seller-app/backend
node utils/initDb.js
```

### Step 3: Install Dependencies

```bash
# Amazing Store Backend
cd "amazing store/backend"
npm install

# Seller App Backend
cd ../../seller-app/backend
npm install
```

### Step 4: Configure Environment Variables

#### Amazing Store Backend (`amazing store/backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/my_marketplace

# Server
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

#### Seller App Backend (`seller-app/backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/my_marketplace

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Step 5: Start Development Servers

```bash
# Terminal 1: Amazing Store Backend
cd "amazing store/backend"
npm run dev

# Terminal 2: Seller App Backend
cd seller-app/backend
npm run dev

# Terminal 3: Frontend (if needed)
# Frontend files are static - serve with any HTTP server or open directly
```

### Step 6: Verify Installation

1. **Check Health Endpoints:**
   - Amazing Store: `http://localhost:3000/health`
   - Seller App: `http://localhost:3001/health`

2. **Check API Documentation:**
   - Amazing Store: `http://localhost:3000/api-docs`
   - Seller App: `http://localhost:3001/api-docs`

---

## 💻 Development Workflow

### Code Structure

#### Backend Structure

```
backend/
├── routes/           # API route handlers
├── middleware/       # Express middleware (auth, validation, error handling)
├── services/         # Business logic layer
├── utils/            # Utility functions (logger, db, errors)
├── config/           # Configuration files (Swagger)
├── __tests__/        # Test files
├── app.js            # Express app configuration
└── server.js         # Server startup
```

#### Frontend Structure

```
frontend/
├── index.html        # Main HTML file
├── app.js            # Main JavaScript file
├── styles.css        # Styles
└── assets/           # Images, icons, etc.
```

### Adding New Features

#### 1. Backend Feature

**Step 1: Create Route**

```javascript
// routes/new-feature.js
const express = require('express');
const router = express.Router();
const { validateBody, required, string } = require('../middleware/validate');

/**
 * @swagger
 * /api/new-feature:
 *   get:
 *     summary: Get new feature data
 *     tags: [NewFeature]
 */
router.get('/', async (req, res) => {
    // Implementation
});

module.exports = router;
```

**Step 2: Register Route**

```javascript
// app.js
const newFeatureRoutes = require('./routes/new-feature');
app.use('/api/new-feature', authenticate, newFeatureRoutes);
```

**Step 3: Add Swagger Documentation**

Add JSDoc comments with `@swagger` tags (see existing routes for examples).

**Step 4: Write Tests**

```javascript
// __tests__/routes/new-feature.test.js
describe('GET /api/new-feature', () => {
    it('should return feature data', async () => {
        // Test implementation
    });
});
```

#### 2. Frontend Feature

**Step 1: Add UI Elements**

```html
<!-- index.html -->
<div id="new-feature-container">
    <!-- UI elements -->
</div>
```

**Step 2: Add JavaScript Logic**

```javascript
// app.js
async function loadNewFeature() {
    const response = await fetch('/api/new-feature');
    const data = await response.json();
    // Update UI
}
```

### Git Workflow

1. **Create Feature Branch:**

```bash
git checkout -b feature/amazing-store-new-feature
# or
git checkout -b feature/seller-app-new-feature
```

2. **Make Changes:**

```bash
# Make code changes
git add .
git commit -m "feat(amazing-store): add new feature"
```

3. **Run Tests & Linting:**

```bash
npm test
npm run lint
npm run format:check
```

4. **Push & Create Pull Request:**

```bash
git push origin feature/amazing-store-new-feature
```

---

## 📚 API Documentation

### Swagger UI

Both backends have interactive API documentation:

- **Amazing Store:** `http://localhost:3000/api-docs`
- **Seller App:** `http://localhost:3001/api-docs`

### Authentication

Both APIs use **Telegram Authentication** via `x-telegram-data` header:

```javascript
headers: {
    'x-telegram-data': '<telegram_auth_data>'
}
```

### Common Endpoints

#### Health Check

```http
GET /health
```

**Response:**
```json
{
    "status": "ok",
    "database": "connected",
    "uptime": 12345,
    "memory": {
        "used": "50 MB",
        "total": "512 MB"
    }
}
```

#### Metrics

```http
GET /metrics
```

**Response:**
```json
{
    "requests": {
        "total": 1000,
        "byMethod": { "GET": 800, "POST": 200 },
        "byStatus": { "200": 950, "404": 50 }
    },
    "responseTime": {
        "average": 50,
        "min": 10,
        "max": 500
    },
    "errors": {
        "total": 5,
        "byType": { "ValidationError": 3, "NotFoundError": 2 }
    }
}
```

### Amazing Store API

**Base URL:** `http://localhost:3000/api`

**Main Endpoints:**
- `GET /products` - Get products (with pagination, language support)
- `GET /categories` - Get categories
- `GET /banners` - Get banners
- `GET /orders` - Get user orders
- `POST /orders` - Create order
- `POST /users/validate` - Validate user
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Create/update user profile

### Seller App API

**Base URL:** `http://localhost:3001/api/seller`

**Main Endpoints:**
- `GET /products` - Get products (with pagination)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /orders` - Get orders
- `POST /orders` - Create manual order
- `PUT /orders/:id/status` - Update order status
- `GET /prices` - Get product prices
- `PUT /prices/:id` - Update product price
- `GET /inventory` - Get inventory
- `GET /analytics` - Get analytics

**Full documentation:** See Swagger UI at `/api-docs`

---

## 🗄️ Database Schema

### Shared Tables

Both applications share the same PostgreSQL database:

**Amazing Store Tables:**
- `users` - User accounts
- `products` - Products
- `categories` - Product categories
- `banners` - Banner images
- `orders` - Orders
- `order_items` - Order items

**Seller App Tables:**
- `marketplaces` - Marketplace configurations
- `marketplace_products` - Products in marketplaces
- `product_prices` - Product pricing
- `purchases` - Purchase records
- `inventory` - Inventory management
- `inventory_movements` - Inventory movement history
- `daily_analytics` - Daily analytics
- `product_analytics` - Product analytics

### Database Migrations

Migrations are located in `database/migrations/`:

```bash
# Run migrations manually
cd "amazing store/backend"
node utils/migrate.js

# Or use initDb.js (runs all migrations)
node utils/initDb.js
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
__tests__/
├── routes/           # Route integration tests
├── middleware/       # Middleware tests
├── utils/            # Utility function tests
└── setup.js          # Test setup/teardown
```

### Writing Tests

**Example Route Test:**

```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /api/products', () => {
    it('should return products', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('x-telegram-data', '<test_auth_data>');
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('products');
    });
});
```

---

## ✨ Code Quality

### ESLint

**Configuration:** `.eslintrc.js`

**Run Linting:**

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Common Rules:**
- No `console.log` (use `logger` instead)
- No `var` (use `const`/`let`)
- Use `===` instead of `==`
- Consistent code style

### Prettier

**Configuration:** `.prettierrc.json`

**Run Formatting:**

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

**Settings:**
- Single quotes
- 2 spaces indentation
- Semicolons
- Trailing commas

### Pre-commit Checklist

Before committing code:

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting is correct (`npm run format:check`)
- [ ] Swagger documentation updated (if API changed)
- [ ] README updated (if needed)

---

## 🚢 Deployment

### Railway (Backend)

1. **Connect Repository:**
   - Go to Railway dashboard
   - Click "New Project"
   - Connect GitHub repository

2. **Configure Service:**
   - **Root Directory:** `amazing store/backend` or `seller-app/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** Auto-detected

3. **Set Environment Variables:**
   - `DATABASE_URL` (Railway PostgreSQL)
   - `PORT` (auto-set by Railway)
   - `FRONTEND_URL` (Vercel URL)
   - `TELEGRAM_BOT_TOKEN` (if using bot)

### Vercel (Frontend)

1. **Import Project:**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Connect GitHub repository

2. **Configure Project:**
   - **Root Directory:** `amazing store/frontend` or `seller-app/frontend`
   - **Framework Preset:** Other
   - **Build Command:** (leave empty - static files)
   - **Output Directory:** `.`

3. **Set Environment Variables:**
   - `API_URL` (Railway backend URL)

### Database Migrations on Deployment

Migrations run automatically via `utils/initDb.js` on server startup.

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Check database credentials

#### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 3. Migration Errors

**Error:** `relation already exists`

**Solution:**
- Check if migration already ran
- Manually verify database schema
- Reset database (development only): `DROP DATABASE my_marketplace; CREATE DATABASE my_marketplace;`

#### 4. CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
- Add frontend URL to `allowedOrigins` in `app.js`
- Check `FRONTEND_URL` environment variable

#### 5. Authentication Errors

**Error:** `401 Unauthorized`

**Solution:**
- Verify `x-telegram-data` header is present
- Check Telegram authentication data format
- Verify user is admin (for Seller App)

### Debugging

#### Enable Debug Logging

```javascript
// Set log level to DEBUG
process.env.LOG_LEVEL = 'debug';
```

#### View Logs

```bash
# Backend logs (file-based)
tail -f logs/combined.log
tail -f logs/error.log

# Or check Railway/Vercel logs in dashboard
```

#### Database Queries

```bash
# Connect to database
psql $DATABASE_URL

# Run queries
SELECT * FROM products LIMIT 10;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

---

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Swagger/OpenAPI Documentation](https://swagger.io/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

## 🤝 Contributing

1. Follow the code style (ESLint + Prettier)
2. Write tests for new features
3. Update Swagger documentation
4. Update README if needed
5. Create descriptive commit messages

---

## 📝 License

ISC

---

**Last Updated:** 2024
