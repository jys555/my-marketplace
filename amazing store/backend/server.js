require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./utils/initDb');
const botService = require('./services/bot');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const metricsMiddleware = require('./middleware/metrics');

// Amazing Store routes
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const errorHandler = require('./middleware/errorHandler');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

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
app.use(helmet({ contentSecurityPolicy: false }));

// Request logging (logs to FILE, NOT database)
app.use(requestLogger);

// Metrics collection middleware
app.use(metricsMiddleware);

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
            logger.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Cookie'larni qo'llab-quvvatlash
}));

// Webhook endpoint (agar webhook ishlatilsa) - express.json() dan oldin
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!botService.bot) {
        // Bot hali initialize bo'lmagan yoki disabled
        return res.sendStatus(200); // Telegram'ga 200 qaytarish kerak
    }
    
    try {
        // express.raw() Buffer qaytaradi, Grammy JSON object kutadi
        const update = JSON.parse(req.body.toString());
        await botService.bot.handleUpdate(update);
        res.sendStatus(200);
    } catch (error) {
        logger.error('Webhook error:', error);
        res.sendStatus(200); // Telegram'ga 200 qaytarish kerak
    }
});

app.use(express.json());

// Health check endpoint (rate limit'dan oldin, authentication'dan oldin)
app.get('/health', healthRoutes.healthCheck);

// Metrics endpoint (rate limit'dan oldin, authentication'dan oldin)
app.get('/metrics', metricsRoutes.getMetrics);

// Swagger API Documentation (rate limit'dan oldin, authentication'dan oldin)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Amazing Store API Documentation'
}));

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

// PHASE 3: Error Handler Middleware (barcha route'lardan keyin)
app.use(errorHandler);

// Database'ni initialize qilib, keyin serverni ishga tushirish
async function startServer() {
    try {
        // Amazing Store database migration
        await initializeDatabase();
        
        // Bot'ni ishga tushirish
        await botService.initialize();
        
        // Server ishga tushirish
        app.listen(PORT, () => {
            logger.info(`✅ Amazing Store Server is running on port ${PORT}`);
            logger.info(`📱 Frontend: http://localhost:${PORT}`);
            logger.info(`🤖 Telegram Bot: ${botService.bot ? 'Active' : 'Disabled'}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();