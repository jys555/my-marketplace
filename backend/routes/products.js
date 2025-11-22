const express = require('express');
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Fetch all active products with language support
router.get('/', async (req, res) => {
    // Tilni so'rovdan olamiz, standart 'uz'
    const lang = ['uz', 'ru'].includes(req.query.lang) ? req.query.lang : 'uz';

    try {
        // is_active=TRUE sharti qo'shildi va nom/tavsif uchun COALESCE ishlatildi
        const { rows } = await pool.query(`
            SELECT 
                p.id, 
                COALESCE(NULLIF(p.name_${lang}, ''), p.name_uz) as name,
                COALESCE(NULLIF(p.description_${lang}, ''), p.description_uz) as description,
                p.price, 
                p.sale_price, 
                p.image_url AS image,
                COALESCE(p.sale_price, p.price) AS display_price
            FROM products p
            WHERE p.is_active = TRUE
            ORDER BY p.sort_order ASC, p.created_at DESC
        `, []);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/products - Add a new product (for admins)
router.post('/', authenticate, isAdmin, async (req, res) => {
    const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url } = req.body;

    if (!name_uz || !price) {
        return res.status(400).json({ error: 'name_uz and price are required' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name_uz, name_ru || name_uz, description_uz, description_ru, price, sale_price, image_url]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Error adding product' });
    }
});

module.exports = router;