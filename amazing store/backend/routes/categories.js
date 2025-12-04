const express = require('express');
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - Barcha faol kategoriyalarni olish
router.get('/', async (req, res) => {
    // Tilni so'rovdan olamiz, standart 'uz'
    const allowedLangs = ['uz', 'ru'];
    const lang = allowedLangs.includes(req.query.lang) ? req.query.lang : 'uz';

    try {
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
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/categories - Yangi kategoriya qo'shish (admin uchun)
router.post('/', authenticate, isAdmin, async (req, res) => {
    const { name_uz, name_ru, icon, color, sort_order } = req.body;

    // Validatsiya
    if (!name_uz || !name_uz.trim()) {
        return res.status(400).json({ error: 'Kategoriya nomi (O\'zbekcha) majburiy' });
    }
    if (!name_ru || !name_ru.trim()) {
        return res.status(400).json({ error: 'Kategoriya nomi (Ruscha) majburiy' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO categories (name_uz, name_ru, icon, color, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name_uz, name_ru, icon || '📦', color || '#999', sort_order || 0]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Error adding category' });
    }
});

// PUT /api/categories/:id - Kategoriyani yangilash (admin uchun)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
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
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Error updating category' });
    }
});

module.exports = router;

