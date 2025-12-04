require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./utils/initDb');
const botService = require('./services/bot');

// Amazing Store routes
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway, Heroku kabi platformalarda reverse proxy orqali ishlash uchun
app.set('trust proxy', 1);

// Rate limiting - DDoS va brute-force hujumlaridan himoya
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 100, // Har bir IP dan 15 daqiqada maksimum 100 ta so'rov
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Global middleware
app.use(helmet({ contentSecurityPolicy: false })); // Xavfsizlik headerlari

// CORS sozlamalari - faqat ishonchli domenlardan so'rovlar qabul qilinadi
const allowedOrigins = [
    'https://web.telegram.org',
    'https://telegram.org',
    'https://amazing-store-frontend.vercel.app', // Amazing Store Vercel URL
    process.env.FRONTEND_URL // Railway'da o'rnatilgan frontend URL
].filter(Boolean); // null/undefined qiymatlarni tozalash

app.use(cors({
    origin: (origin, callback) => {
        // Telegram Mini App'dan so'rovlarda origin bo'lmasligi mumkin (null)
        // Shuning uchun origin yo'q bo'lsa ham ruxsat beramiz
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Cookie'larni qo'llab-quvvatlash
}));

// Webhook endpoint (agar webhook ishlatilsa) - express.json() dan oldin
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (botService.bot) {
        try {
            await botService.bot.handleUpdate(req.body);
            res.sendStatus(200);
        } catch (error) {
            console.error('Webhook error:', error);
            res.sendStatus(200); // Telegram'ga 200 qaytarish kerak
        }
    } else {
        res.sendStatus(200);
    }
});

app.use(express.json());
app.use('/api/', apiLimiter); // API endpointlariga rate limit qo'llash

// Static files: Amazing Store frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Amazing Store API routes
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Frontend marshrutizatsiyasi (Amazing Store)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database'ni initialize qilib, keyin serverni ishga tushirish
async function startServer() {
    try {
        // Amazing Store database migration
        await initializeDatabase();
        
        // Bot'ni ishga tushirish
        await botService.initialize();
        
        // Server ishga tushirish
        app.listen(PORT, () => {
            console.log(`✅ Amazing Store Server is running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🤖 Telegram Bot: ${botService.bot ? 'Active' : 'Disabled'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();