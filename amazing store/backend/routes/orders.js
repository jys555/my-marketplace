const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - Foydalanuvchi buyurtmalarini olish
router.get('/', authenticate, async (req, res) => {
    if (!req.userId) {
        // Agar foydalanuvchi bizning DBda ro'yxatdan o'tmagan bo'lsa, uning buyurtmalari yo'q
        return res.json([]);
    }
    const userId = req.userId;

    try {
        const { rows: orders } = await pool.query(`
            SELECT
                o.id, o.order_number, o.status, o.created_at, o.updated_at,
                o.total_amount, o.payment_method, o.delivery_method,
                json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [userId]);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/orders - Yangi buyurtma yaratish
router.post('/', authenticate, async (req, res) => {
    if (!req.userId) {
        // Buyurtma yaratish uchun foydalanuvchi ro'yxatdan o'tgan bo'lishi shart
        return res.status(403).json({ error: 'User must be registered to create an order.' });
    }
    const userId = req.userId;
    const { items, payment_method, delivery_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain an array of items' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const productIds = items.map(item => item.product_id);
        const { rows: products } = await client.query('SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])', [productIds]);

        if (products.length !== productIds.length) {
            throw new Error('One or more products not found');
        }

        const productPriceMap = products.reduce((acc, p) => {
            acc[p.id] = parseFloat(p.sale_price || p.price);
            return acc;
        }, {});

        let totalAmount = 0;
        for (const item of items) {
            const price = productPriceMap[item.product_id];
            if (!price || item.quantity <= 0) {
                 throw new Error(`Invalid data for product ID ${item.product_id}`);
            }
            totalAmount += price * item.quantity;
        }

        const orderNumber = `${Date.now()}-${userId}`;

        const { rows: orderRows } = await client.query(
            'INSERT INTO orders (user_id, total_amount, status, payment_method, delivery_method, order_number, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
            [userId, totalAmount.toFixed(2), 'new', payment_method, delivery_method, orderNumber]
        );
        const orderId = orderRows[0].id;

        const itemInsertQueries = items.map(item => {
            const price = productPriceMap[item.product_id];
            return client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, price]
            );
        });
        await Promise.all(itemInsertQueries);

        await client.query('COMMIT');
        res.status(201).json({ id: orderId, status: 'new', total_amount: totalAmount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;