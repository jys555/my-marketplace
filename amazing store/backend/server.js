console.log('=== AMAZING STORE SERVER STARTING ===');
console.log('Step 1: Loading dotenv...');
require('dotenv').config();
console.log('Step 2: dotenv loaded');

console.log('Step 3: Loading express...');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
console.log('Step 4: express loaded');

console.log('Step 5: Checking DATABASE_URL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
console.log('PORT:', process.env.PORT || 3000);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

console.log('Step 6: Loading database utilities...');
const { initializeDatabase } = require('./utils/initDb');
const botService = require('./services/bot');
console.log('Step 7: Database utilities loaded');

console.log('Step 8: Loading logger...');
const logger = require('./utils/logger');
console.log('Step 9: Logger loaded');

const requestLogger = require('./middleware/requestLogger');
const metricsMiddleware = require('./middleware/metrics');
console.log('Step 10: Middleware loaded');

// Amazing Store routes
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
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
    process.env.FRONTEND_URL, // Railway'da o'rnatilgan frontend URL
].filter(Boolean); // null/undefined qiymatlarni tozalash

app.use(
    cors({
        origin: (origin, callback) => {
            // Origin yo'q bo'lsa (Telegram Mini App yoki boshqa client)
            // Telegram Mini Apps often don't send Origin header, so we allow it
            if (!origin) {
                logger.debug(
                    'CORS: Allowing request without origin (Telegram Mini App or same-origin)'
                );
                return callback(null, true);
            }

            // Allowed origins ro'yxatida bo'lsa, ruxsat berish
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked request from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Cookie'larni qo'llab-quvvatlash
    })
);

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
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Amazing Store API Documentation',
    })
);

app.use('/api/', apiLimiter); // API endpointlariga rate limit qo'llash

// Static files: Amazing Store frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Amazing Store API routes
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// Frontend marshrutizatsiyasi (Amazing Store)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// PHASE 3: Error Handler Middleware (barcha route'lardan keyin)
app.use(errorHandler);

// Database'ni initialize qilib, keyin serverni ishga tushirish
async function startServer() {
    try {
        logger.info('🚀 Starting Amazing Store Server...');
        logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔌 Port: ${PORT}`);

        // Test database connection
        logger.info('🔄 Testing database connection...');
        const pool = require('./db');
        try {
            await pool.query('SELECT NOW()');
            logger.info('✅ Database connection established successfully');
        } catch (err) {
            logger.error('❌ Database connection failed:', err);
            logger.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
            throw err;
        }

        // Amazing Store database migration
        logger.info('🔄 Initializing database...');
        await initializeDatabase();
        logger.info('✅ Database initialized successfully');

        // CRITICAL FIX: Ensure products.images column exists (production DB drift fix)
        // Some environments may have migration tracking out-of-sync with actual schema.
        logger.info('🔄 Verifying products.images column...');
        try {
            const imagesColumnCheck = await pool.query(
                `
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'products'
                  AND column_name = 'images'
                LIMIT 1
                `
            );

            if (imagesColumnCheck.rows.length === 0) {
                logger.warn('⚠️  products.images column missing, applying schema fix now...');

                // 1) Add images column
                await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`);
                logger.info('✅ products.images column added');

                // 2) Best-effort migrate from image_url if that legacy column exists
                const legacyImageUrlCheck = await pool.query(
                    `
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'products'
                      AND column_name = 'image_url'
                    LIMIT 1
                    `
                );

                if (legacyImageUrlCheck.rows.length > 0) {
                    await pool.query(`
                        UPDATE products
                        SET images = jsonb_build_array(
                            jsonb_build_object(
                                'url', image_url,
                                'has_white_background', false
                            )
                        )
                        WHERE (images IS NULL OR images = '[]'::jsonb)
                          AND image_url IS NOT NULL
                          AND image_url <> ''
                    `);
                    logger.info('✅ Migrated legacy products.image_url into products.images');

                    // Drop legacy column to keep schema clean
                    await pool.query(`ALTER TABLE products DROP COLUMN IF EXISTS image_url`);
                    logger.info('✅ Dropped legacy products.image_url column');
                } else {
                    logger.info('ℹ️  Legacy products.image_url column not present, skipping migration step');
                }
            } else {
                logger.info('✅ products.images column exists');
            }
        } catch (e) {
            logger.error('❌ Failed verifying/applying products.images schema fix:', e);
            throw e;
        }

        // CRITICAL FIX: Ensure cart_items table exists and has required columns
        // This is a workaround for migration tracking bug
        logger.info('🔄 Verifying cart_items table...');
        try {
            await pool.query('SELECT 1 FROM cart_items LIMIT 1');
            logger.info('✅ cart_items table exists');

            // Check if is_selected and is_liked columns exist
            const columnCheck = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'cart_items' 
                AND column_name IN ('is_selected', 'is_liked')
            `);

            const existingColumns = columnCheck.rows.map(row => row.column_name);

            if (!existingColumns.includes('is_selected')) {
                logger.warn('⚠️  Adding is_selected column to cart_items...');
                try {
                    await pool.query(`
                        ALTER TABLE cart_items 
                        ADD COLUMN is_selected BOOLEAN DEFAULT TRUE
                    `);
                    logger.info('✅ is_selected column added');
                } catch (alterError) {
                    // Column may already exist (race condition)
                    if (alterError.code !== '42701') {
                        // duplicate_column
                        logger.error('Error adding is_selected column:', alterError.message);
                        throw alterError;
                    }
                    logger.info('✅ is_selected column already exists');
                }
            }

            if (!existingColumns.includes('is_liked')) {
                logger.warn('⚠️  Adding is_liked column to cart_items...');
                try {
                    await pool.query(`
                        ALTER TABLE cart_items 
                        ADD COLUMN is_liked BOOLEAN DEFAULT FALSE
                    `);
                    logger.info('✅ is_liked column added');
                } catch (alterError) {
                    // Column may already exist (race condition)
                    if (alterError.code !== '42701') {
                        // duplicate_column
                        logger.error('Error adding is_liked column:', alterError.message);
                        throw alterError;
                    }
                    logger.info('✅ is_liked column already exists');
                }
            }
        } catch (error) {
            if (error.code === '42P01') {
                // relation does not exist
                logger.warn('⚠️  cart_items table not found, creating now...');
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS cart_items (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
                        price_snapshot NUMERIC(10,2) NOT NULL,
                        is_selected BOOLEAN DEFAULT TRUE,
                        is_liked BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        UNIQUE(user_id, product_id)
                    );

                    CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
                    CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
                    CREATE INDEX IF NOT EXISTS idx_cart_items_is_selected ON cart_items(is_selected) WHERE is_selected = TRUE;

                    CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = NOW();
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;

                    CREATE TRIGGER cart_items_updated_at_trigger
                        BEFORE UPDATE ON cart_items
                        FOR EACH ROW
                        EXECUTE FUNCTION update_cart_items_updated_at();
                `);
                logger.info('✅ cart_items table created successfully');
            } else {
                throw error;
            }
        }

        // Bot'ni ishga tushirish
        logger.info('🤖 Initializing Telegram bot...');
        await botService.initialize();
        logger.info('✅ Bot initialization completed');

        // Server ishga tushirish
        app.listen(PORT, () => {
            logger.info(`✅ Amazing Store Server is running on port ${PORT}`);
            logger.info(`📱 Frontend: http://localhost:${PORT}`);
            logger.info(`🤖 Telegram Bot: ${botService.bot ? 'Active' : 'Disabled'}`);
            logger.info(`🚀 Server started at: ${new Date().toISOString()}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        logger.error('❌ Error stack:', error.stack);
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start server
logger.info('📝 Server script loaded, calling startServer()...');
startServer().catch(error => {
    logger.error('❌ Unhandled error in startServer():', error);
    console.error('❌ Unhandled error in startServer():', error);
    process.exit(1);
});
