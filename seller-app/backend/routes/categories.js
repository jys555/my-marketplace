const express = require('express');
const router = express.Router();
const pool = require('../db');
const { AppError, NotFoundError } = require('../utils/errors');

/**
 * GET /api/seller/categories
 * Fetch all categories (with multilang support)
 */
router.get('/', async (req, res, next) => {
    try {
        const lang = req.query.lang || 'uz';
        
        const { rows } = await pool.query(
            `
            SELECT 
                id,
                CASE 
                    WHEN $1 = 'ru' THEN name_ru 
                    ELSE name_uz 
                END as name,
                name_uz,
                name_ru,
                icon,
                color,
                sort_order,
                is_active,
                created_at
            FROM categories
            WHERE is_active = TRUE
            ORDER BY sort_order ASC, name_uz ASC
            `,
            [lang]
        );
        
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/seller/categories/:id
 * Fetch a single category by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const lang = req.query.lang || 'uz';
        
        const { rows } = await pool.query(
            `
            SELECT 
                id,
                CASE 
                    WHEN $2 = 'ru' THEN name_ru 
                    ELSE name_uz 
                END as name,
                name_uz,
                name_ru,
                icon,
                color,
                sort_order,
                is_active,
                created_at
            FROM categories
            WHERE id = $1
            `,
            [id, lang]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Category not found');
        }
        
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/seller/categories
 * Create a new category (admin only)
 */
router.post('/', async (req, res, next) => {
    try {
        const { name_uz, name_ru, icon, color, sort_order, is_active } = req.body;
        
        // Validation
        if (!name_uz || !name_ru) {
            throw new AppError('name_uz and name_ru are required', 400);
        }
        
        const { rows } = await pool.query(
            `
            INSERT INTO categories (name_uz, name_ru, icon, color, sort_order, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [name_uz, name_ru, icon || null, color || null, sort_order || 0, is_active !== false]
        );
        
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/seller/categories/:id
 * Update an existing category (admin only)
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name_uz, name_ru, icon, color, sort_order, is_active } = req.body;
        
        const { rows } = await pool.query(
            `
            UPDATE categories
            SET 
                name_uz = COALESCE($2, name_uz),
                name_ru = COALESCE($3, name_ru),
                icon = COALESCE($4, icon),
                color = COALESCE($5, color),
                sort_order = COALESCE($6, sort_order),
                is_active = COALESCE($7, is_active)
            WHERE id = $1
            RETURNING *
            `,
            [id, name_uz, name_ru, icon, color, sort_order, is_active]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Category not found');
        }
        
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/seller/categories/:id
 * Delete a category (admin only)
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const { rows } = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Category not found');
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
