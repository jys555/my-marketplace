const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/seller/marketplaces - Barcha marketplacelar
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                id, name, api_type, marketplace_code, is_active,
                created_at, updated_at
            FROM marketplaces
            ORDER BY name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching marketplaces:', error);
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
        console.error('Error fetching marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/marketplaces - Yangi marketplace
router.post('/', async (req, res) => {
    try {
        const { name, api_type, marketplace_code, is_active = true } = req.body;

        if (!name || !api_type) {
            return res.status(400).json({ error: 'Name and api_type are required' });
        }

        const { rows } = await pool.query(`
            INSERT INTO marketplaces (name, api_type, marketplace_code, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, api_type, marketplace_code, is_active, created_at, updated_at
        `, [name, api_type, marketplace_code || null, is_active]);

        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Marketplace with this name already exists' });
        }
        console.error('Error creating marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/marketplaces/:id - Marketplace yangilash
router.put('/:id', async (req, res) => {
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
            return res.status(404).json({ error: 'Marketplace not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Marketplace with this name already exists' });
        }
        console.error('Error updating marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

        res.json({ message: 'Marketplace deleted successfully' });
    } catch (error) {
        console.error('Error deleting marketplace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

