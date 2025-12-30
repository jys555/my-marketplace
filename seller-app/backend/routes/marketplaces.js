const express = require('express');
const pool = require('../db');
const cache = require('../utils/cache');
const router = express.Router();
const { validateBody, validateParams, required, string, optional, url, boolean, integer } = require('../middleware/validate');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

// PERFORMANCE: Cache TTL (Time To Live) - 10 daqiqa (marketplace'lar kam o'zgaradi)
const CACHE_TTL = 10 * 60; // 600 soniya
const CACHE_KEY = 'marketplaces:list';

// GET /api/seller/marketplaces - Barcha marketplacelar
router.get('/', async (req, res) => {
    try {
        // PERFORMANCE: Avval cache'dan tekshirish
        const cached = cache.get(CACHE_KEY);
        if (cached !== null) {
            return res.json(cached);
        }

        // Cache'da yo'q bo'lsa, database'dan olish
        const { rows } = await pool.query(`
            SELECT 
                id, name, api_type, marketplace_code, is_active,
                created_at, updated_at
            FROM marketplaces
            ORDER BY name ASC
        `);
        
        // PERFORMANCE: Cache'ga saqlash
        cache.set(CACHE_KEY, rows, CACHE_TTL);
        
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching marketplaces:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/marketplaces/:id - Bitta marketplace
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                id, name, api_type, marketplace_code, is_active,
                created_at, updated_at
            FROM marketplaces
            WHERE id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Marketplace not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        logger.error('Error fetching marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/marketplaces - Yangi marketplace
router.post('/',
    validateBody({
        name: required(string),
        api_type: required(string),
        marketplace_code: optional(string),
        is_active: optional(boolean)
    }),
    async (req, res, next) => {
    try {
        const { name, api_type, marketplace_code, is_active = true } = req.body;

        const { rows } = await pool.query(`
            INSERT INTO marketplaces (name, api_type, marketplace_code, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, api_type, marketplace_code, is_active, created_at, updated_at
        `, [name, api_type, marketplace_code || null, is_active]);

        // PERFORMANCE: Marketplaces cache'ni tozalash (yangi marketplace qo'shildi)
        cache.delete(CACHE_KEY);

        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return next(new ConflictError('Marketplace with this name already exists'));
        }
        next(error);
    }
});

// PUT /api/seller/marketplaces/:id - Marketplace yangilash
router.put('/:id',
    validateParams({
        id: required(integer)
    }),
    validateBody({
        name: optional(string),
        api_type: optional(string),
        marketplace_code: optional(string),
        is_active: optional(boolean)
    }),
    async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, api_type, marketplace_code, is_active } = req.body;

        const { rows } = await pool.query(`
            UPDATE marketplaces
            SET 
                name = COALESCE($1, name),
                api_type = COALESCE($2, api_type),
                marketplace_code = COALESCE($3, marketplace_code),
                is_active = COALESCE($4, is_active),
                updated_at = NOW()
            WHERE id = $5
            RETURNING id, name, api_type, marketplace_code, is_active, created_at, updated_at
        `, [name, api_type, marketplace_code, is_active, id]);

        if (rows.length === 0) {
            return next(new NotFoundError('Marketplace'));
        }

        // PERFORMANCE: Marketplaces cache'ni tozalash (marketplace o'zgartirildi)
        cache.delete(CACHE_KEY);

        res.json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return next(new ConflictError('Marketplace with this name already exists'));
        }
        next(error);
    }
});

// DELETE /api/seller/marketplaces/:id - Marketplace o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(`
            DELETE FROM marketplaces
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Marketplace not found' });
        }

        // PERFORMANCE: Marketplaces cache'ni tozalash (marketplace o'chirildi)
        cache.delete(CACHE_KEY);

        res.json({ message: 'Marketplace deleted successfully' });
    } catch (error) {
        logger.error('Error deleting marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

