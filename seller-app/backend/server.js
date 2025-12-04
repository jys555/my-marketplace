require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./utils/initDb');

// Routes (keyinroq yaratiladi)
// const marketplaceRoutes = require('./routes/marketplaces');
// const priceRoutes = require('./routes/prices');
// const purchaseRoutes = require('./routes/purchases');
// const inventoryRoutes = require('./routes/inventory');
// const analyticsRoutes = require('./routes/analytics');
// const productRoutes = require('./routes/products');
// const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy
app.set('trust proxy', 1);

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
// CORS sozlamalari
const allowedOrigins = [
    'https://seller-app-frontend.vercel.app',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use('/api/', apiLimiter);

// Static files: Seller App frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes (keyinroq qo'shiladi)
// app.use('/api/seller/marketplaces', marketplaceRoutes);
// app.use('/api/seller/prices', priceRoutes);
// app.use('/api/seller/purchases', purchaseRoutes);
// app.use('/api/seller/inventory', inventoryRoutes);
// app.use('/api/seller/analytics', analyticsRoutes);
// app.use('/api/seller/products', productRoutes);
// app.use('/api/seller/orders', orderRoutes);

// Temporary test route
app.get('/api/seller/test', (req, res) => {
    res.json({ message: 'Seller App API is working!' });
});

// Frontend routing (SPA uchun)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database'ni initialize qilib, keyin serverni ishga tushirish
async function startServer() {
    try {
        // Seller App database migration
        await initializeDatabase();
        
        // Server ishga tushirish
        app.listen(PORT, () => {
            console.log(`✅ Seller App Server is running on port ${PORT}`);
            console.log(`📊 Frontend: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

