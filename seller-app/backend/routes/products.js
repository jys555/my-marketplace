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
                p.sku,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        
        // Note: ID is included for internal use (foreign keys, backend logic)
        // Frontend should use SKU as primary identifier
        const params = [];
        let paramIndex = 1;

        if (category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(category_id);
            paramIndex++;
        }

        if (search) {
            query += ` AND (p.name_uz ILIKE $${paramIndex} OR p.name_ru ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        const { rows } = await pool.query(query, params);
        
        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        // ID backend'da kerak (foreign keys), lekin frontend'da ko'rinmasligi kerak
        const products = rows.map(row => {
            const { id, ...rest } = row;
            return {
                ...rest,
                _id: id  // Yashirilgan ID (ichki ishlatish uchun, frontend'da ishlatilmasligi kerak)
            };
        });
        
        res.json(products);
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
                p.sku,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1 OR p.sku = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        const { id: productId, ...rest } = rows[0];
        res.json({
            ...rest,
            _id: productId  // Yashirilgan ID (ichki ishlatish uchun)
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/products - Yangi tovar (Amazing Store)
router.post('/', async (req, res) => {
    try {
        const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, sku } = req.body;

        if (!name_uz || !price) {
            return res.status(400).json({ error: 'name_uz and price are required' });
        }

        // SKU majburiy, agar berilmagan bo'lsa avtomatik generatsiya qilish
        let finalSku = sku;
        if (!finalSku || finalSku.trim() === '') {
            // Avtomatik SKU generatsiya qilish
            const timestamp = Date.now();
            finalSku = `PROD-${timestamp}`;
            
            // SKU unique bo'lishini tekshirish
            let counter = 1;
            while (true) {
                const { rows: existing } = await pool.query(
                    'SELECT id FROM products WHERE sku = $1',
                    [finalSku]
                );
                if (existing.length === 0) break;
                finalSku = `PROD-${timestamp}-${counter}`;
                counter++;
            }
        }

        const { rows } = await pool.query(`
            INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, sku)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, sku, created_at
        `, [name_uz, name_ru || null, description_uz || null, description_ru || null, price, sale_price || null, image_url || null, category_id || null, true, finalSku]);

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        const { id, ...rest } = rows[0];
        res.status(201).json({
            ...rest,
            _id: id  // Yashirilgan ID (ichki ishlatish uchun)
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'SKU already exists' });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/products/:id - Tovar yangilash (id yoki sku orqali)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, sku } = req.body;

        // SKU yangilash bo'lsa, unique tekshirish
        if (sku) {
            const { rows: existing } = await pool.query(
                'SELECT id FROM products WHERE sku = $1 AND (id != $2 OR id::text != $2)',
                [sku, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'SKU already exists' });
            }
        }

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
                category_id = COALESCE($8, category_id),
                sku = COALESCE($9, sku)
            WHERE id = $10 OR sku = $10
            RETURNING id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, sku, created_at
        `, [name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, sku, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        const { id: productId, ...rest } = rows[0];
        res.json({
            ...rest,
            _id: productId  // Yashirilgan ID (ichki ishlatish uchun)
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'SKU already exists' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/seller/products/:id - Tovar o'chirish (id yoki sku orqali)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(`
            DELETE FROM products
            WHERE id = $1 OR sku = $1
            RETURNING id, sku
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        res.json({ 
            message: 'Product deleted successfully',
            sku: rows[0].sku  // SKU'ni qaytarish (ID emas)
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

