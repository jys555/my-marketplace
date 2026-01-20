const express = require('express');
const pool = require('../db');
const cache = require('../utils/cache');
const router = express.Router();
const {
    validateBody,
    validateParams,
    required,
    string,
    optional,
    url,
    boolean,
    integer,
} = require('../middleware/validate');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

// PERFORMANCE: Cache TTL (Time To Live) - 10 daqiqa (marketplace'lar kam o'zgaradi)
const CACHE_TTL = 10 * 60; // 600 soniya
const CACHE_KEY = 'marketplaces:list';

// GET /api/seller/marketplaces - Barcha marketplacelar
// Endi marketplaces table yo'q, faqat static list qaytaramiz
router.get('/', async (req, res) => {
    try {
        // PERFORMANCE: Avval cache'dan tekshirish
        const cached = cache.get(CACHE_KEY);
        if (cached !== null) {
            return res.json(cached);
        }

        // Static marketplace list (marketplaces table o'chirilgan)
        const marketplaces = [
            {
                id: 'amazing_store',
                name: 'AMAZING_STORE',
                api_type: 'amazing_store',
                marketplace_code: '202049831',
                is_active: true
            },
            {
                id: 'yandex',
                name: 'Yandex Market',
                api_type: 'yandex',
                marketplace_code: null,
                is_active: true
            },
            {
                id: 'uzum',
                name: 'Uzum Market',
                api_type: 'uzum',
                marketplace_code: null,
                is_active: true
            }
        ];

        // PERFORMANCE: Cache'ga saqlash
        cache.set(CACHE_KEY, marketplaces, CACHE_TTL);

        res.json(marketplaces);
    } catch (error) {
        logger.error('Error fetching marketplaces:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/marketplaces/:id - Bitta marketplace
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Static marketplace list
        const marketplaces = {
            'amazing_store': {
                id: 'amazing_store',
                name: 'AMAZING_STORE',
                api_type: 'amazing_store',
                marketplace_code: '202049831',
                is_active: true
            },
            'yandex': {
                id: 'yandex',
                name: 'Yandex Market',
                api_type: 'yandex',
                marketplace_code: null,
                is_active: true
            },
            'uzum': {
                id: 'uzum',
                name: 'Uzum Market',
                api_type: 'uzum',
                marketplace_code: null,
                is_active: true
            }
        };

        const marketplace = marketplaces[id] || marketplaces[id.toLowerCase()];
        if (!marketplace) {
            return res.status(404).json({ error: 'Marketplace not found' });
        }

        res.json(marketplace);
    } catch (error) {
        logger.error('Error fetching marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/marketplaces - Yangi marketplace
// Endi marketplaces table yo'q, faqat read-only
router.post('/', async (req, res) => {
    res.status(405).json({ error: 'Marketplace creation is not supported. Use product_marketplace_integrations table instead.' });
});

// PUT /api/seller/marketplaces/:id - Marketplace yangilash
// Endi marketplaces table yo'q, faqat read-only
router.put('/:id', async (req, res) => {
    res.status(405).json({ error: 'Marketplace update is not supported. Use product_marketplace_integrations table instead.' });
});

// DELETE /api/seller/marketplaces/:id - Marketplace o'chirish
// Endi marketplaces table yo'q, faqat read-only
router.delete('/:id', async (req, res) => {
    res.status(405).json({ error: 'Marketplace deletion is not supported. Use product_marketplace_integrations table instead.' });
});

module.exports = router;
