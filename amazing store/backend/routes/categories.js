const express = require('express');
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');
const cache = require('../utils/cache');
const { validateBody, validateParams, required, string, optional, url, integer, boolean } = require('../middleware/validate');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();

// PERFORMANCE: Cache TTL (Time To Live) - 5 daqiqa
const CACHE_TTL = 5 * 60; // 300 soniya

// GET /api/categories - Barcha faol kategoriyalarni olish
router.get('/', async (req, res, next) => {
    // Tilni so'rovdan olamiz, standart 'uz'
    const allowedLangs = ['uz', 'ru'];
    const lang = allowedLangs.includes(req.query.lang) ? req.query.lang : 'uz';

    // PERFORMANCE: Cache key (tilga qarab)
    const cacheKey = `categories:${lang}`;

    try {
        // PERFORMANCE: Avval cache'dan tekshirish
        const cached = cache.get(cacheKey);
        if (cached !== null) {
            return res.json(cached);
        }

        // Cache'da yo'q bo'lsa, database'dan olish
        const { rows } = await pool.query(`
            SELECT 
                id,
                CASE 
                    WHEN $1 = 'ru' THEN name_ru
                    ELSE name_uz 
                END as name,
                icon,
                color,
                sort_order
            FROM categories
            WHERE is_active = TRUE
            ORDER BY sort_order ASC
        `, [lang]);
        
        // PERFORMANCE: Cache'ga saqlash
        cache.set(cacheKey, rows, CACHE_TTL);
        
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/categories - Yangi kategoriya qo'shish (admin uchun)
router.post('/', authenticate, isAdmin,
    validateBody({
        name_uz: required(string),
        name_ru: required(string),
        icon: optional(string),
        color: optional(string),
        sort_order: optional(integer)
    }),
    async (req, res, next) => {
    const { name_uz, name_ru, icon, color, sort_order } = req.body;

    try {
        const { rows } = await pool.query(
            `INSERT INTO categories (name_uz, name_ru, icon, color, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name_uz, name_ru, icon || '📦', color || '#999', sort_order || 0]
        );
        
        // PERFORMANCE: Categories cache'ni tozalash (yangi kategoriya qo'shildi)
        cache.deletePattern('categories:*');
        
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT /api/categories/:id - Kategoriyani yangilash (admin uchun)
router.put('/:id', authenticate, isAdmin,
    validateParams({
        id: required(integer)
    }),
    validateBody({
        name_uz: optional(string),
        name_ru: optional(string),
        icon: optional(string),
        color: optional(string),
        sort_order: optional(integer),
        is_active: optional(boolean)
    }),
    async (req, res, next) => {
    const { id } = req.params;
    const { name_uz, name_ru, icon, color, sort_order, is_active } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE categories 
             SET name_uz = COALESCE($1, name_uz),
                 name_ru = COALESCE($2, name_ru),
                 icon = COALESCE($3, icon),
                 color = COALESCE($4, color),
                 sort_order = COALESCE($5, sort_order),
                 is_active = COALESCE($6, is_active)
             WHERE id = $7
             RETURNING *`,
            [name_uz, name_ru, icon, color, sort_order, is_active, id]
        );
        
        if (rows.length === 0) {
            return next(new NotFoundError('Category'));
        }
        
        // PERFORMANCE: Categories cache'ni tozalash (kategoriya o'zgartirildi)
        cache.deletePattern('categories:*');
        
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

