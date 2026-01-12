const express = require('express');
const pool = require('../db');
const router = express.Router();
const {
    validateBody,
    required,
    optional,
    string,
    url,
    integer,
    boolean,
} = require('../middleware/validate');
const logger = require('../utils/logger');

/**
 * POST /api/seller/banners
 * Create new banner for Amazing Store
 */
router.post(
    '/',
    validateBody({
        title_uz: optional(string),
        title_ru: optional(string),
        image_url: required(url),
        link_type: optional(string),
        link_id: optional(integer),
        link_url: optional(url),
        sort_order: optional(integer),
        is_active: optional(boolean),
    }),
    async (req, res, next) => {
        try {
            const {
                title_uz,
                title_ru,
                image_url,
                link_type,
                link_id,
                link_url,
                sort_order = 0,
                is_active = true,
            } = req.body;

            const { rows } = await pool.query(
                `INSERT INTO banners (
                    title_uz, title_ru, image_url,
                    link_type, link_id, link_url,
                    sort_order, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    title_uz || null,
                    title_ru || null,
                    image_url,
                    link_type || null,
                    link_id || null,
                    link_url || null,
                    sort_order,
                    is_active,
                ]
            );

            logger.info('✅ Banner created:', { id: rows[0].id, image_url });
            res.status(201).json(rows[0]);
        } catch (error) {
            logger.error('❌ Error creating banner:', error);
            next(error);
        }
    }
);

/**
 * GET /api/seller/banners
 * Get all banners
 */
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`
        );

        res.json(rows);
    } catch (error) {
        logger.error('❌ Error fetching banners:', error);
        next(error);
    }
});

/**
 * PUT /api/seller/banners/:id
 * Update banner
 */
router.put(
    '/:id',
    validateBody({
        title_uz: optional(string),
        title_ru: optional(string),
        image_url: optional(url),
        link_type: optional(string),
        link_id: optional(integer),
        link_url: optional(url),
        sort_order: optional(integer),
        is_active: optional(boolean),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const {
                title_uz,
                title_ru,
                image_url,
                link_type,
                link_id,
                link_url,
                sort_order,
                is_active,
            } = req.body;

            const { rows } = await pool.query(
                `UPDATE banners
                SET 
                    title_uz = COALESCE($1, title_uz),
                    title_ru = COALESCE($2, title_ru),
                    image_url = COALESCE($3, image_url),
                    link_type = COALESCE($4, link_type),
                    link_id = COALESCE($5, link_id),
                    link_url = COALESCE($6, link_url),
                    sort_order = COALESCE($7, sort_order),
                    is_active = COALESCE($8, is_active),
                    updated_at = NOW()
                WHERE id = $9
                RETURNING *`,
                [
                    title_uz,
                    title_ru,
                    image_url,
                    link_type,
                    link_id,
                    link_url,
                    sort_order,
                    is_active,
                    id,
                ]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Banner topilmadi' });
            }

            logger.info('✅ Banner updated:', { id });
            res.json(rows[0]);
        } catch (error) {
            logger.error('❌ Error updating banner:', error);
            next(error);
        }
    }
);

/**
 * DELETE /api/seller/banners/:id
 * Delete banner
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Banner topilmadi' });
        }

        logger.info('✅ Banner deleted:', { id });
        res.json({ message: "Banner o'chirildi", id: rows[0].id });
    } catch (error) {
        logger.error('❌ Error deleting banner:', error);
        next(error);
    }
});

module.exports = router;
