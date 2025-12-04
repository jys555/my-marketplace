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

// POST /api/products - Add a new product (for admins)
router.post('/', authenticate, isAdmin, async (req, res) => {
    // O'ZGARTIRILDI: category_id qo'shildi
    const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id } = req.body;

    // Validatsiya - mahsulot nomi
    if (!name_uz || !name_uz.trim()) {
        return res.status(400).json({ error: 'Mahsulot nomi (O\'zbekcha) majburiy' });
    }

    // Validatsiya - narx (musbat son bo'lishi kerak)
    if (!price || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Narx musbat son bo\'lishi kerak' });
    }

    // Validatsiya - chegirma narxi (agar bor bo'lsa)
    if (sale_price !== null && sale_price !== undefined) {
        if (typeof sale_price !== 'number' || sale_price <= 0) {
            return res.status(400).json({ error: 'Chegirma narxi musbat son bo\'lishi kerak' });
        }
        if (sale_price >= price) {
            return res.status(400).json({ error: 'Chegirma narxi asosiy narxdan kichik bo\'lishi kerak' });
        }
    }

    // Validatsiya - rasm URL (agar bor bo'lsa)
    if (image_url && !image_url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)) {
        return res.status(400).json({ error: 'Noto\'g\'ri rasm URL. Faqat jpg, png, webp, gif formatlar qo\'llab-quvvatlanadi' });
    }

    // Validatsiya - kategoriya (agar berilgan bo'lsa)
    if (category_id && (typeof category_id !== 'number' || category_id <= 0)) {
        return res.status(400).json({ error: 'Noto\'g\'ri kategoriya ID' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name_uz, name_ru || name_uz, description_uz, description_ru, price, sale_price, image_url, category_id || null]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error adding product:', error);
        // Foreign key constraint xatosi
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Noto\'g\'ri kategoriya ID. Bunday kategoriya mavjud emas' });
        }
        res.status(500).json({ error: 'Error adding product' });
    }
});

module.exports = router;