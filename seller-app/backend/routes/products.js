const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/seller/products - Barcha tovarlar (Amazing Store)
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, search, category_id } = req.query;

        let query = `
            SELECT 
                p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
                p.price, p.sale_price, p.image_url, p.category_id, p.is_active,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(category_id);
            paramIndex++;
        }

        if (search) {
            query += ` AND (p.name_uz ILIKE $${paramIndex} OR p.name_ru ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/products/:id - Bitta tovar
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
                p.price, p.sale_price, p.image_url, p.category_id, p.is_active,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/products - Yangi tovar (Amazing Store)
router.post('/', async (req, res) => {
    try {
        const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id } = req.body;

        if (!name_uz || !price) {
            return res.status(400).json({ error: 'name_uz and price are required' });
        }

        const { rows } = await pool.query(`
            INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, created_at
        `, [name_uz, name_ru || null, description_uz || null, description_ru || null, price, sale_price || null, image_url || null, category_id || null, true]);

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/products/:id - Tovar yangilash
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id } = req.body;

        const { rows } = await pool.query(`
            UPDATE products
            SET 
                name_uz = COALESCE($1, name_uz),
                name_ru = COALESCE($2, name_ru),
                description_uz = COALESCE($3, description_uz),
                description_ru = COALESCE($4, description_ru),
                price = COALESCE($5, price),
                sale_price = COALESCE($6, sale_price),
                image_url = COALESCE($7, image_url),
                category_id = COALESCE($8, category_id)
            WHERE id = $9
            RETURNING id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, created_at
        `, [name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/seller/products/:id - Tovar o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(`
            DELETE FROM products
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

