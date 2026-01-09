const express = require('express');
const pool = require('../db');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const router = express.Router();

// PERFORMANCE: Cache TTL (Time To Live) - 5 daqiqada bir marta yangilanadi
const CACHE_TTL = 5 * 60; // 300 soniya

// GET /api/banners - Fetch all active banners
router.get('/', async (req, res, next) => {
    try {
        // Database connection'ni tekshirish
        if (!pool) {
            logger.error('Database pool is not initialized');
            return res.status(500).json({
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Database connection not available',
                },
            });
        }

        // Get language from query (default: uz)
        const allowedLangs = ['uz', 'ru'];
        const lang = allowedLangs.includes(req.query.lang) ? req.query.lang : 'uz';
        
        // PERFORMANCE: Cache key includes language
        const CACHE_KEY = `banners:active:${lang}`;

        // PERFORMANCE: Avval cache'dan tekshirish
        const cached = cache.get(CACHE_KEY);
        if (cached !== null) {
            return res.json(cached);
        }
        
        // Cache'da yo'q bo'lsa, database'dan olish
        const { rows } = await pool.query(
            `SELECT 
                id, 
                CASE 
                    WHEN $1 = 'ru' THEN COALESCE(NULLIF(title_ru, ''), title_uz)
                    ELSE title_uz 
                END as title,
                image_url, 
                link_type,
                link_id,
                link_url, 
                is_active, 
                sort_order 
            FROM banners 
            WHERE is_active = TRUE 
            ORDER BY sort_order ASC`,
            [lang]
        );

        // PERFORMANCE: Cache'ga saqlash
        cache.set(CACHE_KEY, rows, CACHE_TTL);

        res.json(rows);
    } catch (error) {
        logger.error('Error fetching banners:', error);
        next(error);
    }
});

module.exports = router;
