const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/seller/prices - Barcha narxlar
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, product_id } = req.query;

        let query = `
            SELECT 
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price, pp.profitability, pp.updated_at,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url,
                m.name as marketplace_name, m.api_type as marketplace_type
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (marketplace_id) {
            query += ` AND pp.marketplace_id = $${paramIndex}`;
            params.push(marketplace_id);
            paramIndex++;
        }

        if (product_id) {
            query += ` AND pp.product_id = $${paramIndex}`;
            params.push(product_id);
            paramIndex++;
        }

        query += ` ORDER BY p.name_uz ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/prices/:id - Bitta narx
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price, pp.profitability, pp.updated_at,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                m.name as marketplace_name
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
            WHERE pp.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/prices - Yangi narx
router.post('/', async (req, res) => {
    try {
        const { product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        // Rentabillikni hisoblash
        let profitability = null;
        if (cost_price && selling_price) {
            const profit = parseFloat(selling_price) - parseFloat(cost_price);
            const commission = commission_rate ? (parseFloat(selling_price) * parseFloat(commission_rate) / 100) : 0;
            profitability = profit - commission;
        }

        const { rows } = await pool.query(`
            INSERT INTO product_prices (product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (product_id, marketplace_id) 
            DO UPDATE SET
                cost_price = EXCLUDED.cost_price,
                selling_price = EXCLUDED.selling_price,
                commission_rate = EXCLUDED.commission_rate,
                strikethrough_price = EXCLUDED.strikethrough_price,
                profitability = EXCLUDED.profitability,
                updated_at = NOW()
            RETURNING id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at
        `, [product_id, marketplace_id || null, cost_price || null, selling_price || null, commission_rate || null, strikethrough_price || null, profitability]);

        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Product or marketplace not found' });
        }
        console.error('Error creating price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/prices/:id - Narx yangilash
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

        // Rentabillikni hisoblash
        let profitability = null;
        if (cost_price && selling_price) {
            const profit = parseFloat(selling_price) - parseFloat(cost_price);
            const commission = commission_rate ? (parseFloat(selling_price) * parseFloat(commission_rate) / 100) : 0;
            profitability = profit - commission;
        }

        const { rows } = await pool.query(`
            UPDATE product_prices
            SET 
                cost_price = COALESCE($1, cost_price),
                selling_price = COALESCE($2, selling_price),
                commission_rate = COALESCE($3, commission_rate),
                strikethrough_price = COALESCE($4, strikethrough_price),
                profitability = COALESCE($5, profitability),
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at
        `, [cost_price, selling_price, commission_rate, strikethrough_price, profitability, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/seller/prices/:id - Narx o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(`
            DELETE FROM product_prices
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json({ message: 'Price deleted successfully' });
    } catch (error) {
        console.error('Error deleting price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

