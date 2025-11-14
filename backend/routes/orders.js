// backend/routes/orders.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Unikal buyurtma raqamini yaratish funksiyasi
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `AMZ-${timestamp.slice(-6)}-${randomPart}`;
}

// Foydalanuvchining barcha buyurtmalarini olish
router.get('/:telegram_id', async (req, res) => {
    const { telegram_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT 
                o.id, o.order_number, o.status, o.total_amount, o.created_at,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
             FROM orders o
             WHERE o.user_id = $1 
             ORDER BY o.created_at DESC`,
            [telegram_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Yangi buyurtma yaratish
router.post('/', async (req, res) => {
    const { user_id, items, payment_method, delivery_method } = req.body;

    if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ error: "Kerakli ma'lumotlar to'liq emas." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Mahsulotlar narxini bazadan olish va umumiy summani hisoblash
        const productIds = items.map(item => item.product_id);
        const productsResult = await client.query(
            'SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])',
            [productIds]
        );

        let totalAmount = 0;
        const productPrices = {};
        productsResult.rows.forEach(p => {
            productPrices[p.id] = parseFloat(p.sale_price || p.price);
        });

        for (const item of items) {
            if (!productPrices[item.product_id]) {
                throw new Error(`Mahsulot (id: ${item.product_id}) topilmadi yoki narxi yo'q.`);
            }
            totalAmount += productPrices[item.product_id] * item.quantity;
        }

        // 2. `orders` jadvaliga yozish
        const orderNumber = generateOrderNumber();
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, order_number, total_amount, payment_method, delivery_method)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, order_number, created_at`,
            [user_id, orderNumber, totalAmount, payment_method, delivery_method]
        );
        const newOrder = orderResult.rows[0];

        // 3. `order_items` jadvaliga yozish
        const itemQueries = items.map(item => {
            const price = productPrices[item.product_id];
            return client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [newOrder.id, item.product_id, item.quantity, price]
            );
        });
        await Promise.all(itemQueries);

        await client.query('COMMIT');
        res.status(201).json(newOrder);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Buyurtma yaratishda xatolik yuz berdi.' });
    } finally {
        client.release();
    }
});

module.exports = router;