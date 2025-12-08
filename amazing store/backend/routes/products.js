const express = require('express');
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Fetch all active products with language support
router.get('/', async (req, res) => {
    // O'ZGARTIRILDI: Kategoriya bo'yicha filtrlash qo'shildi
    const allowedLangs = ['uz', 'ru'];
    const lang = allowedLangs.includes(req.query.lang) ? req.query.lang : 'uz';
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;

    try {
        let query = `
            SELECT 
                p.id,
                CASE 
                    WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.name_ru, ''), p.name_uz)
                    ELSE p.name_uz 
                END as name,
                CASE 
                    WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.description_ru, ''), p.description_uz)
                    ELSE p.description_uz 
                END as description,
                p.price, 
                p.sale_price, 
                p.image_url AS image,
                p.category_id,
                COALESCE(p.sale_price, p.price) AS display_price
            FROM products p
        `;
        
        const params = [lang];
        
        // Kategoriya bo'yicha filtrlash
        if (categoryId && !isNaN(categoryId)) {
            query += ` WHERE p.category_id = $2`;
            params.push(categoryId);
        }
        
        query += ` ORDER BY p.created_at DESC`;
        
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/products - REMOVED
// Product yaratish endi Seller App'da amalga oshiriladi
// Amazing Store faqat client-facing API (GET only)
// Product management: Seller App -> /api/seller/products (POST, PUT, DELETE)

module.exports = router;