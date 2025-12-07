const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/seller/orders - Barcha buyurtmalar
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, status, start_date, end_date } = req.query;

        let query = `
            SELECT 
                o.id, o.order_number, o.status, o.total_amount,
                o.payment_method, o.delivery_method,
                o.marketplace_id, o.marketplace_order_id,
                o.customer_name, o.customer_phone, o.customer_address,
                o.order_date, o.delivery_date,
                o.created_at, o.updated_at,
                m.name as marketplace_name, m.api_type as marketplace_type,
                COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN marketplaces m ON o.marketplace_id = m.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (marketplace_id) {
            query += ` AND o.marketplace_id = $${paramIndex}`;
            params.push(marketplace_id);
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

        query += ` GROUP BY o.id, m.name, m.api_type ORDER BY o.created_at DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/orders/:id - Bitta buyurtma
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Order ma'lumotlari
        const { rows: orderRows } = await pool.query(`
            SELECT 
                o.id, o.order_number, o.status, o.total_amount,
                o.payment_method, o.delivery_method,
                o.marketplace_id, o.marketplace_order_id,
                o.customer_name, o.customer_phone, o.customer_address,
                o.order_date, o.delivery_date,
                o.created_at, o.updated_at,
                m.name as marketplace_name, m.api_type as marketplace_type
            FROM orders o
            LEFT JOIN marketplaces m ON o.marketplace_id = m.id
            WHERE o.id = $1
        `, [id]);

        if (orderRows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Order items
        const { rows: itemsRows } = await pool.query(`
            SELECT 
                oi.id, oi.product_id, oi.quantity, oi.price,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
        `, [id]);

        res.json({
            ...orderRows[0],
            items: itemsRows
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/orders/:id/status - Buyurtma statusini yangilash
router.put('/:id/status', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'status is required' });
        }

        const validStatuses = ['new', 'processing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
        }

        // Order statusini yangilash
        const { rows } = await client.query(`
            UPDATE orders
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, order_number, status, total_amount, updated_at
        `, [status, id]);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Agar buyurtma bekor qilinsa yoki yetkazib berilsa, inventory'ni yangilash
        if (status === 'cancelled' || status === 'delivered') {
            const { rows: itemsRows } = await client.query(`
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = $1
            `, [id]);

            for (const item of itemsRows) {
                if (status === 'cancelled') {
                    // Bekor qilingan buyurtma - qoldiqni qaytarish
                    await client.query(`
                        UPDATE inventory
                        SET quantity = quantity + $1,
                            last_updated_at = NOW()
                        WHERE product_id = $2
                    `, [item.quantity, item.product_id]);

                    // Inventory movement yozish
                    const { rows: invRows } = await client.query(`
                        SELECT quantity FROM inventory WHERE product_id = $1
                    `, [item.product_id]);
                    const quantityAfter = invRows.length > 0 ? invRows[0].quantity : item.quantity;
                    const quantityBefore = quantityAfter - item.quantity;

                    await client.query(`
                        INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
                        VALUES ($1, $2, 'return', $3, $4, $5, 'Order cancelled')
                    `, [item.product_id, id, item.quantity, quantityBefore, quantityAfter]);
                } else if (status === 'delivered') {
                    // Yetkazib berilgan buyurtma - rezervni kamaytirish
                    await client.query(`
                        UPDATE inventory
                        SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
                            last_updated_at = NOW()
                        WHERE product_id = $2
                    `, [item.quantity, item.product_id]);
                }
            }
        }

        await client.query('COMMIT');
        res.json(rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// POST /api/seller/orders - Yangi buyurtma (manual)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { marketplace_id, items, customer_name, customer_phone, customer_address, payment_method, delivery_method } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'items array is required' });
        }

        // Product narxlarini olish
        const productIds = items.map(item => item.product_id);
        const { rows: productsRows } = await client.query(`
            SELECT id, price, sale_price
            FROM products
            WHERE id = ANY($1::int[])
        `, [productIds]);

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
                return res.status(400).json({ error: `Invalid data for product ID ${item.product_id}` });
            }
            totalAmount += price * item.quantity;
        }

        const orderNumber = `MANUAL-${Date.now()}`;

        // Order yaratish
        const { rows: orderRows } = await client.query(`
            INSERT INTO orders (
                marketplace_id, order_number, total_amount, status,
                payment_method, delivery_method,
                customer_name, customer_phone, customer_address,
                order_date
            )
            VALUES ($1, $2, $3, 'new', $4, $5, $6, $7, $8, NOW())
            RETURNING id, order_number, status, total_amount, created_at
        `, [marketplace_id || null, orderNumber, totalAmount, payment_method || null, delivery_method || null, customer_name || null, customer_phone || null, customer_address || null]);

        const orderId = orderRows[0].id;

        // Order items yaratish va inventory'ni yangilash
        for (const item of items) {
            const price = productPriceMap[item.product_id];

            await client.query(`
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `, [orderId, item.product_id, item.quantity, price]);

            // Inventory'ni yangilash (qoldiqni kamaytirish, rezervni oshirish)
            await client.query(`
                INSERT INTO inventory (product_id, quantity, reserved_quantity, last_updated_at)
                VALUES ($1, -$2, $2, NOW())
                ON CONFLICT (product_id) 
                DO UPDATE SET
                    quantity = GREATEST(0, inventory.quantity - $2),
                    reserved_quantity = inventory.reserved_quantity + $2,
                    last_updated_at = NOW()
            `, [item.product_id, item.quantity]);

            // Inventory movement yozish
            const { rows: invRows } = await client.query(`
                SELECT quantity, reserved_quantity FROM inventory WHERE product_id = $1
            `, [item.product_id]);
            const quantityBefore = invRows.length > 0 ? invRows[0].quantity + item.quantity : item.quantity;
            const quantityAfter = invRows.length > 0 ? invRows[0].quantity : 0;

            await client.query(`
                INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
                VALUES ($1, $2, 'sale', $3, $4, $5, 'Order created')
            `, [item.product_id, orderId, -item.quantity, quantityBefore, quantityAfter]);
        }

        await client.query('COMMIT');
        res.status(201).json(orderRows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

module.exports = router;

