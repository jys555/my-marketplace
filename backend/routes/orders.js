const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - Get authenticated user's orders
router.get('/', authenticate, async (req, res) => {
    try {
        // Foydalanuvchi ID'sini telegram_id orqali topamiz
        const { rows: userRows } = await db.query('SELECT id FROM users WHERE telegram_id = $1', [req.telegramUser.id]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userRows[0].id;

        const { rows: orders } = await pool.query(`
            SELECT
                o.id,
                o.status,
                o.total_price,
                o.created_at,
                json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
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

// POST /api/orders - Create a new order for the authenticated user
router.post('/', authenticate, async (req, res) => {
    const { items, payment_method, delivery_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain an array of items' });
    }

    const client = await pool.getClient();

    try {
        await client.query('BEGIN');

        // Foydalanuvchi ID'sini req.telegramUser'dan xavfsiz tarzda olamiz
        const { rows: userRows } = await client.query('SELECT id FROM users WHERE telegram_id = $1', [req.telegramUser.id]);
        if (userRows.length === 0) {
            // Bu holat deyarli yuz bermasligi kerak, chunki 'authenticate' middleware bor
            throw new Error('Authenticated user not found in database.');
        }
        const userId = userRows[0].id;

        // Mahsulotlar narxini tekshirish
        const productIds = items.map(item => item.product_id);
        const { rows: products } = await client.query('SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])', [productIds]);

        if (products.length !== productIds.length) {
            throw new Error('One or more products not found');
        }

        const productPriceMap = products.reduce((acc, p) => {
            acc[p.id] = parseFloat(p.sale_price || p.price);
            return acc;
        }, {});

        // Umumiy summani hisoblash
        let totalPrice = 0;
        for (const item of items) {
            if (!productPriceMap[item.product_id] || item.quantity <= 0) {
                 throw new Error(`Invalid data for product ID ${item.product_id}`);
            }
            totalPrice += productPriceMap[item.product_id] * item.quantity;
        }

        // Yangi buyurtma yaratish
        const { rows: orderRows } = await client.query(
            'INSERT INTO orders (user_id, total_price, status, payment_method, delivery_method) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, totalPrice, 'new', payment_method, delivery_method]
        );
        const orderId = orderRows[0].id;

        // Buyurtma tarkibini saqlash
        const itemInsertQueries = items.map(item => {
            const price = productPriceMap[item.product_id];
            return client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, price]
            );
        });
        await Promise.all(itemInsertQueries);

        await client.query('COMMIT');

        // Telegram xabarnomasi yuborish mantig'i bu yerda bo'lmasligi kerak.
        // Uni alohida servis yoki message queue orqali qilish to'g'riroq.
        // Hozircha bu mantiqni olib turamiz.

        res.status(201).json({ id: orderId, status: 'new', total_price: totalPrice });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;