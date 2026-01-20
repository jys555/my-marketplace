const express = require('express');
const pool = require('../db');
const router = express.Router();
const {
    validateParams,
    validateBody,
    required,
    oneOf,
    optional,
    integer,
    array,
    positive,
} = require('../middleware/validate');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/seller/orders:
 *   get:
 *     summary: Get all orders with optional filtering
 *     description: Retrieve a list of orders with optional filtering by marketplace, status, and date range
 *     tags: [Orders]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: query
 *         name: marketplace_id
 *         schema:
 *           type: integer
 *         description: Filter by marketplace ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, processing, ready, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successful response with orders list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
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
// GET /api/seller/orders - Barcha buyurtmalar
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, status, start_date, end_date } = req.query;

        logger.info('📋 GET /api/seller/orders - Request', {
            marketplace_id,
            status,
            start_date,
            end_date,
        });

        // Handle marketplace_id - convert string to integer ID if needed
        let finalMarketplaceId = null;
        if (marketplace_id) {
            try {
                const marketplaceIdInt = parseInt(marketplace_id);
                if (!isNaN(marketplaceIdInt)) {
                    finalMarketplaceId = marketplaceIdInt;
                } else {
                    // String slug/name - convert to marketplace type
                    // Endi marketplaces table yo'q, faqat type'lar ishlatiladi
                    const marketplaceTypes = {
                        'amazing_store': null, // Amazing Store uchun marketplace_id = null
                        'yandex': 'yandex',
                        'uzum': 'uzum'
                    };
                    
                    const marketplaceType = marketplaceTypes[marketplace_id.toLowerCase()];
                    if (marketplaceType) {
                        // Marketplace type bo'yicha filter qilish
                        // Lekin orders table'da marketplace_id bor, shuning uchun hozircha null qoldiramiz
                        finalMarketplaceId = null;
                        logger.info('📋 Marketplace type found:', {
                            input: marketplace_id,
                            type: marketplaceType
                        });
                    } else {
                        logger.info('📋 Marketplace ID found:', {
                            input: marketplace_id,
                            found_id: finalMarketplaceId,
                        });
                    } else {
                        logger.warn('⚠️ Marketplace not found:', { input: marketplace_id });
                    }
                }
            } catch (marketplaceError) {
                logger.error('❌ Error looking up marketplace:', marketplaceError);
                // Continue without marketplace filter if lookup fails
            }
        }

        // Calculate total_amount from order_items (column doesn't exist in orders table)
        let query = `
            SELECT 
                o.id, o.order_number, o.status,
                COALESCE((
                    SELECT SUM(oi.price * oi.quantity) 
                    FROM order_items oi 
                    WHERE oi.order_id = o.id
                ), 0) as total_amount,
                o.marketplace_id, o.marketplace_order_id,
                o.customer_name, o.customer_phone, o.customer_address,
                o.order_date, o.delivery_date,
                o.created_at, o.updated_at,
                CASE 
                    WHEN o.marketplace_id IS NULL THEN 'AMAZING_STORE'
                    WHEN EXISTS (SELECT 1 FROM product_marketplace_integrations pmi WHERE pmi.product_id IN (SELECT product_id FROM order_items WHERE order_id = o.id) AND pmi.marketplace_type = 'yandex') THEN 'Yandex Market'
                    WHEN EXISTS (SELECT 1 FROM product_marketplace_integrations pmi WHERE pmi.product_id IN (SELECT product_id FROM order_items WHERE order_id = o.id) AND pmi.marketplace_type = 'uzum') THEN 'Uzum Market'
                    ELSE 'AMAZING_STORE'
                END as marketplace_name,
                CASE 
                    WHEN o.marketplace_id IS NULL THEN 'amazing_store'
                    WHEN EXISTS (SELECT 1 FROM product_marketplace_integrations pmi WHERE pmi.product_id IN (SELECT product_id FROM order_items WHERE order_id = o.id) AND pmi.marketplace_type = 'yandex') THEN 'yandex'
                    WHEN EXISTS (SELECT 1 FROM product_marketplace_integrations pmi WHERE pmi.product_id IN (SELECT product_id FROM order_items WHERE order_id = o.id) AND pmi.marketplace_type = 'uzum') THEN 'uzum'
                    ELSE 'amazing_store'
                END as marketplace_type,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
            FROM orders o
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (finalMarketplaceId) {
            query += ` AND o.marketplace_id = $${paramIndex}`;
            params.push(finalMarketplaceId);
            paramIndex++;
        }

        if (status) {
            query += ` AND o.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (start_date) {
            query += ` AND o.order_date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND o.order_date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY o.created_at DESC`;

        logger.info('📋 GET /api/seller/orders - Query', { query, params });

        // Check pool connection
        if (!pool) {
            logger.error('❌ Database pool is not initialized');
            return res.status(500).json({
                error: 'Internal Server Error',
                details: 'Database connection not available',
            });
        }

        const { rows } = await pool.query(query, params);
        logger.info('📋 GET /api/seller/orders - Response', { count: rows.length });
        res.json(rows);
    } catch (error) {
        logger.error('❌ Error fetching orders:', error);
        logger.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
        });
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            code: error.code,
        });
    }
});

/**
 * @swagger
 * /api/seller/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     description: Retrieve order details including order items
 *     tags: [Orders]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Successful response with order details and items
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Order'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderItem'
 *       404:
 *         description: Order not found
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
// GET /api/seller/orders/:id - Bitta buyurtma
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Calculate total_amount from order_items (column doesn't exist in orders table)
        const { rows: orderRows } = await pool.query(
            `
            SELECT 
                o.id, o.order_number, o.status,
                COALESCE((
                    SELECT SUM(oi.price * oi.quantity) 
                    FROM order_items oi 
                    WHERE oi.order_id = o.id
                ), 0) as total_amount,
                o.marketplace_id, o.marketplace_order_id,
                o.customer_name, o.customer_phone, o.customer_address,
                o.order_date, o.delivery_date,
                o.created_at, o.updated_at,
                m.name as marketplace_name, m.api_type as marketplace_type
            FROM orders o
            WHERE o.id = $1
        `,
            [id]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Order items
        const { rows: itemsRows } = await pool.query(
            `
            SELECT 
                oi.id, oi.product_id, oi.quantity, oi.price,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
        `,
            [id]
        );

        res.json({
            ...orderRows[0],
            items: itemsRows,
        });
    } catch (error) {
        logger.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/seller/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     description: Update order status. When status changes to 'cancelled' or 'delivered', inventory is automatically updated.
 *     tags: [Orders]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, processing, ready, delivered, cancelled]
 *                 description: New order status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 order_number:
 *                   type: string
 *                 status:
 *                   type: string
 *                 total_amount:
 *                   type: number
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
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
// PUT /api/seller/orders/:id/status - Buyurtma statusini yangilash
router.put(
    '/:id/status',
    validateParams({
        id: required(integer),
    }),
    validateBody({
        status: required(oneOf(['new', 'processing', 'ready', 'delivered', 'cancelled'])),
    }),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { status } = req.body;

            // Order statusini yangilash
            const { rows } = await client.query(
                `
            UPDATE orders
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, order_number, status, total_amount, updated_at
        `,
                [status, id]
            );

            if (rows.length === 0) {
                await client.query('ROLLBACK');
                return next(new NotFoundError('Order'));
            }

            // Agar buyurtma bekor qilinsa yoki yetkazib berilsa, inventory'ni yangilash
            if (status === 'cancelled' || status === 'delivered') {
                const { rows: itemsRows } = await client.query(
                    `
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = $1
            `,
                    [id]
                );

                for (const item of itemsRows) {
                    if (status === 'cancelled') {
                        // Bekor qilingan buyurtma - qoldiqni qaytarish
                        await client.query(
                            `
                        UPDATE inventory
                        SET quantity = quantity + $1,
                            last_updated_at = NOW()
                        WHERE product_id = $2
                    `,
                            [item.quantity, item.product_id]
                        );

                        // Inventory movement yozish
                        const { rows: invRows } = await client.query(
                            `
                        SELECT quantity FROM inventory WHERE product_id = $1
                    `,
                            [item.product_id]
                        );
                        const quantityAfter =
                            invRows.length > 0 ? invRows[0].quantity : item.quantity;
                        const quantityBefore = quantityAfter - item.quantity;

                        await client.query(
                            `
                        INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
                        VALUES ($1, $2, 'return', $3, $4, $5, 'Order cancelled')
                    `,
                            [item.product_id, id, item.quantity, quantityBefore, quantityAfter]
                        );
                    } else if (status === 'delivered') {
                        // Yetkazib berilgan buyurtma - rezervni kamaytirish
                        await client.query(
                            `
                        UPDATE inventory
                        SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
                            last_updated_at = NOW()
                        WHERE product_id = $2
                    `,
                            [item.quantity, item.product_id]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            res.json(rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

/**
 * @swagger
 * /api/seller/orders:
 *   post:
 *     summary: Create a new manual order
 *     description: Create a new order manually. Inventory will be automatically updated (quantity decreased, reserved increased).
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
 *               marketplace_id:
 *                 type: integer
 *                 description: Marketplace ID (optional)
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
 *               customer_name:
 *                 type: string
 *                 description: Customer name
 *               customer_phone:
 *                 type: string
 *                 description: Customer phone number
 *               customer_address:
 *                 type: string
 *                 description: Customer address
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
 *                 order_number:
 *                   type: string
 *                 status:
 *                   type: string
 *                 total_amount:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (invalid items, products not found, etc.)
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
// POST /api/seller/orders - Yangi buyurtma (manual)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { marketplace_id, items, customer_name, customer_phone, customer_address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'items array is required' });
        }

        // Product narxlarini olish
        const productIds = items.map(item => item.product_id);
        const { rows: productsRows } = await client.query(
            `
            SELECT id, price, sale_price
            FROM products
            WHERE id = ANY($1::int[])
        `,
            [productIds]
        );

        if (productsRows.length !== productIds.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'One or more products not found' });
        }

        const productPriceMap = productsRows.reduce((acc, p) => {
            acc[p.id] = parseFloat(p.sale_price || p.price);
            return acc;
        }, {});

        let totalAmount = 0;
        for (const item of items) {
            const price = productPriceMap[item.product_id];
            if (!price || item.quantity <= 0) {
                await client.query('ROLLBACK');
                return res
                    .status(400)
                    .json({ error: `Invalid data for product ID ${item.product_id}` });
            }
            totalAmount += price * item.quantity;
        }

        const orderNumber = `MANUAL-${Date.now()}`;

        // Order yaratish (payment_method, delivery_method, total_amount yo'q)
        const { rows: orderRows } = await client.query(
            `
            INSERT INTO orders (
                marketplace_id, order_number, status,
                customer_name, customer_phone, customer_address,
                order_date
            )
            VALUES ($1, $2, 'new', $3, $4, $5, NOW())
            RETURNING id, order_number, status, created_at
        `,
            [
                marketplace_id || null,
                orderNumber,
                customer_name || null,
                customer_phone || null,
                customer_address || null,
            ]
        );

        const orderId = orderRows[0].id;

        // Order items yaratish va inventory'ni yangilash
        for (const item of items) {
            const price = productPriceMap[item.product_id];

            await client.query(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `,
                [orderId, item.product_id, item.quantity, price]
            );

            // Inventory'ni yangilash (qoldiqni kamaytirish, rezervni oshirish)
            await client.query(
                `
                INSERT INTO inventory (product_id, quantity, reserved_quantity, last_updated_at)
                VALUES ($1, -$2, $2, NOW())
                ON CONFLICT (product_id) 
                DO UPDATE SET
                    quantity = GREATEST(0, inventory.quantity - $2),
                    reserved_quantity = inventory.reserved_quantity + $2,
                    last_updated_at = NOW()
            `,
                [item.product_id, item.quantity]
            );

            // Inventory movement yozish
            const { rows: invRows } = await client.query(
                `
                SELECT quantity, reserved_quantity FROM inventory WHERE product_id = $1
            `,
                [item.product_id]
            );
            const quantityBefore =
                invRows.length > 0 ? invRows[0].quantity + item.quantity : item.quantity;
            const quantityAfter = invRows.length > 0 ? invRows[0].quantity : 0;

            await client.query(
                `
                INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
                VALUES ($1, $2, 'sale', $3, $4, $5, 'Order created')
            `,
                [item.product_id, orderId, -item.quantity, quantityBefore, quantityAfter]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(orderRows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

module.exports = router;
