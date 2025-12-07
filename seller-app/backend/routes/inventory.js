const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/seller/inventory - Barcha ombor qoldiqlari
router.get('/', async (req, res) => {
    try {
        const { marketplace_id } = req.query;

        let query = `
            SELECT 
                i.id, i.product_id, i.quantity, i.reserved_quantity,
                i.last_updated_at, i.created_at,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url,
                p.price, p.sale_price
            FROM inventory i
            INNER JOIN products p ON i.product_id = p.id
            WHERE 1=1
        `;
        const params = [];

        // Marketplace bo'yicha filter (keyinroq qo'shiladi)
        // Hozircha barcha tovarlar

        query += ` ORDER BY p.name_uz ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/inventory/:product_id - Bitta tovar qoldig'i
router.get('/:product_id', async (req, res) => {
    try {
        const { product_id } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                i.id, i.product_id, i.quantity, i.reserved_quantity,
                i.last_updated_at, i.created_at,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru
            FROM inventory i
            INNER JOIN products p ON i.product_id = p.id
            WHERE i.product_id = $1
        `, [product_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Inventory not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/inventory/:product_id/adjust - Qoldiqni tuzatish
router.put('/:product_id/adjust', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { product_id } = req.params;
        const { quantity, notes } = req.body;

        if (quantity === undefined || quantity === null) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'quantity is required' });
        }

        // Eski qoldiqni olish
        const { rows: oldRows } = await client.query(`
            SELECT quantity FROM inventory WHERE product_id = $1
        `, [product_id]);

        const quantityBefore = oldRows.length > 0 ? oldRows[0].quantity : 0;
        const quantityChange = parseFloat(quantity) - quantityBefore;

        // Qoldiqni yangilash
        const { rows } = await client.query(`
            INSERT INTO inventory (product_id, quantity, last_updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (product_id) 
            DO UPDATE SET
                quantity = $2,
                last_updated_at = NOW()
            RETURNING id, product_id, quantity, reserved_quantity, last_updated_at
        `, [product_id, quantity]);

        // Inventory movement yozish
        await client.query(`
            INSERT INTO inventory_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
            VALUES ($1, 'adjustment', $2, $3, $4, $5)
        `, [product_id, quantityChange, quantityBefore, quantity, notes || 'Manual adjustment']);

        await client.query('COMMIT');
        res.json(rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// GET /api/seller/inventory/:product_id/movements - Tovar harakatlari
router.get('/:product_id/movements', async (req, res) => {
    try {
        const { product_id } = req.params;
        const { limit = 50 } = req.query;

        const { rows } = await pool.query(`
            SELECT 
                im.id, im.movement_type, im.quantity_change,
                im.quantity_before, im.quantity_after, im.notes,
                im.created_at,
                p.name_uz as product_name_uz
            FROM inventory_movements im
            INNER JOIN products p ON im.product_id = p.id
            WHERE im.product_id = $1
            ORDER BY im.created_at DESC
            LIMIT $2
        `, [product_id, limit]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching inventory movements:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

