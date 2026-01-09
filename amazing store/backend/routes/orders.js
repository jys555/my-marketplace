const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const botService = require('../services/bot');
const logger = require('../utils/logger');
const { validateBody, required, optional, array, string } = require('../middleware/validate');
const { ValidationError, NotFoundError } = require('../utils/errors');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     description: Retrieve all orders for the authenticated user. Returns empty array if user is not registered.
 *     tags: [Orders]
 *     security:
 *       - TelegramAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   order_number:
 *                     type: string
 *                   status:
 *                     type: string
 *                   total_amount:
 *                     type: number
 *                   payment_method:
 *                     type: string
 *                   delivery_method:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/orders - Foydalanuvchi buyurtmalarini olish
router.get('/', authenticate, async (req, res, next) => {
    if (!req.userId) {
        // Agar foydalanuvchi bizning DBda ro'yxatdan o'tmagan bo'lsa, uning buyurtmalari yo'q
        return res.json([]);
    }
    const userId = req.userId;

    try {
        const { rows: orders } = await pool.query(
            `
            SELECT
                o.id, o.order_number, o.status, o.created_at, o.updated_at,
                o.subtotal, o.delivery_fee, o.total,
                o.payment_status,
                json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `,
            [userId]
        );
        res.json(orders);
    } catch (error) {
        logger.error('Error fetching orders:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order for the authenticated user. User must be registered. Admin and customer will receive Telegram notifications.
 *     tags: [Orders]
 *     security:
 *       - TelegramAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Array of order items (required)
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       description: Product ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Item quantity
 *               payment_method:
 *                 type: string
 *                 description: Payment method
 *               delivery_method:
 *                 type: string
 *                 description: Delivery method
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   example: new
 *                 total_amount:
 *                   type: number
 *       400:
 *         description: Validation error (invalid items, user not registered, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: One or more products not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/orders - Yangi buyurtma yaratish
router.post(
    '/',
    authenticate,
    validateBody({
        items: required(array),
        payment_method: optional(string),
        delivery_method: optional(string),
    }),
    async (req, res, next) => {
        if (!req.userId) {
            // Buyurtma yaratish uchun foydalanuvchi ro'yxatdan o'tgan bo'lishi shart
            return next(new Error('User must be registered to create an order.'));
        }
        const userId = req.userId;
        const { items, payment_method, delivery_method } = req.body;

        // Items array validation
        if (!Array.isArray(items) || items.length === 0) {
            return next(
                new ValidationError('Order must contain at least one item', {
                    errors: [{ field: 'items', message: 'At least one item is required' }],
                })
            );
        }

        // Validate each item
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.product_id || !Number.isInteger(item.product_id)) {
                return next(
                    new ValidationError(
                        `Item ${i + 1}: product_id is required and must be an integer`,
                        {
                            errors: [
                                {
                                    field: `items[${i}].product_id`,
                                    message: 'product_id is required and must be an integer',
                                },
                            ],
                        }
                    )
                );
            }
            if (!item.quantity || item.quantity <= 0) {
                return next(
                    new ValidationError(`Item ${i + 1}: quantity must be a positive number`, {
                        errors: [
                            {
                                field: `items[${i}].quantity`,
                                message: 'quantity must be a positive number',
                            },
                        ],
                    })
                );
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const productIds = items.map(item => item.product_id);
            const { rows: products } = await client.query(
                'SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])',
                [productIds]
            );

            if (products.length !== productIds.length) {
                return next(new NotFoundError('One or more products'));
            }

            const productPriceMap = products.reduce((acc, p) => {
                const price = parseFloat(p.sale_price || p.price);
                // Validation: Price 0 yoki manfiy bo'lmasligi kerak
                if (isNaN(price) || price <= 0) {
                    throw new ValidationError(
                        `Invalid price for product ID ${p.id}: price must be greater than 0`
                    );
                }
                acc[p.id] = price;
                return acc;
            }, {});

            let totalAmount = 0;
            for (const item of items) {
                const price = productPriceMap[item.product_id];
                if (!price || price <= 0 || item.quantity <= 0) {
                    return next(
                        new ValidationError(
                            `Invalid data for product ID ${item.product_id}: price and quantity must be greater than 0`
                        )
                    );
                }
                totalAmount += price * item.quantity;
            }

            const orderNumber = `${Date.now()}-${userId}`;

            const { rows: orderRows } = await client.query(
                'INSERT INTO orders (user_id, total_amount, status, payment_method, delivery_method, order_number, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
                [
                    userId,
                    totalAmount.toFixed(2),
                    'new',
                    payment_method,
                    delivery_method,
                    orderNumber,
                ]
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

            // Database'dan saqlangan total_amount'ni olish (string formatda)
            const savedTotalAmount = totalAmount.toFixed(2);

            // Response'ni darhol qaytarish (transaction muvaffaqiyatli yakunlandi)
            res.status(201).json({
                id: orderId,
                status: 'new',
                total_amount: parseFloat(savedTotalAmount), // Number formatda, lekin database'dagi qiymat bilan mos
            });

            // Bot xabarlarini transaction'dan KEYIN yuborish (non-blocking, async)
            // Bu xatolik bo'lsa ham buyurtma allaqachon yaratilgan bo'ladi
            setImmediate(async () => {
                try {
                    // Mijoz ma'lumotlarini olish (transaction'dan keyin, alohida query)
                    const { rows: userRows } = await pool.query(
                        'SELECT first_name, last_name, phone, telegram_id FROM users WHERE id = $1',
                        [userId]
                    );

                    if (userRows.length > 0) {
                        const user = userRows[0];

                        // Admin'ga yangi buyurtma xabari
                        await botService.notifyAdminNewOrder({
                            order_number: orderNumber,
                            total_amount: savedTotalAmount,
                            user_name: `${user.first_name} ${user.last_name || ''}`.trim(),
                            user_phone: user.phone || 'N/A',
                        });

                        // Mijozga tasdiqlash xabari
                        if (user.telegram_id) {
                            await botService.notifyCustomerOrderStatus(
                                {
                                    order_number: orderNumber,
                                    status: 'new',
                                    total_amount: savedTotalAmount,
                                },
                                user.telegram_id
                            );
                        }
                    }
                } catch (botError) {
                    logger.error('Bot notification error (non-critical):', botError);
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating order:', error);
            next(error);
        } finally {
            client.release();
        }
    }
);

module.exports = router;
