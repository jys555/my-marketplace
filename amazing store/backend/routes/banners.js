const express = require('express');
const pool = require('../db');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const router = express.Router();

// PERFORMANCE: Cache TTL (Time To Live) - 5 daqiqada bir marta yangilanadi
const CACHE_TTL = 5 * 60; // 300 soniya
const CACHE_KEY = 'banners:active';

// GET /api/banners - Fetch all active banners
router.get('/', async (req, res, next) => {
    try {
        // PERFORMANCE: Avval cache'dan tekshirish
        const cached = cache.get(CACHE_KEY);
        if (cached !== null) {
            return res.json(cached);
        }

        // Cache'da yo'q bo'lsa, database'dan olish
        const { rows } = await pool.query(
            'SELECT id, title, image_url, link_url, is_active, sort_order FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC'
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