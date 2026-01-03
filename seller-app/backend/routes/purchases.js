const express = require('express');
const pool = require('../db');
const router = express.Router();
const {
    validateBody,
    validateParams,
    required,
    array,
    optional,
    string,
    integer,
    positive,
} = require('../middleware/validate');
const { NotFoundError, ValidationError } = require('../utils/errors');

// GET /api/seller/purchases - Barcha kirimlar
router.get('/', async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                p.id, p.purchase_date, p.total_amount, p.notes, p.created_at,
                COUNT(pi.id) as items_count
            FROM purchases p
            LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (start_date) {
            query += ` AND p.purchase_date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND p.purchase_date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` GROUP BY p.id ORDER BY p.purchase_date DESC, p.created_at DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// GET /api/seller/purchases/:id - Bitta kirim
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Purchase ma'lumotlari
        const { rows: purchaseRows } = await pool.query(
            `
            SELECT 
                id, purchase_date, total_amount, notes, created_at
            FROM purchases
            WHERE id = $1
        `,
            [id]
        );

        if (purchaseRows.length === 0) {
            return next(new NotFoundError('Purchase'));
        }

        // Purchase items
        const { rows: itemsRows } = await pool.query(
            `
            SELECT 
                pi.id, pi.product_id, pi.quantity, pi.purchase_price, pi.total_price,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url
            FROM purchase_items pi
            INNER JOIN products p ON pi.product_id = p.id
            WHERE pi.purchase_id = $1
            ORDER BY pi.id ASC
        `,
            [id]
        );

        res.json({
            ...purchaseRows[0],
            items: itemsRows,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/seller/purchases - Yangi kirim
router.post(
    '/',
    validateBody({
        purchase_date: required(string), // ISO date string
        items: required(array),
        notes: optional(string),
    }),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { purchase_date, items, notes } = req.body;

            // Items array validation (each item must have product_id, quantity, purchase_price)
            if (!Array.isArray(items) || items.length === 0) {
                await client.query('ROLLBACK');
                return next(new ValidationError('items array is required and must not be empty'));
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.product_id || !item.quantity || !item.purchase_price) {
                    await client.query('ROLLBACK');
                    return next(
                        new ValidationError(
                            `Item ${i + 1}: product_id, quantity, and purchase_price are required`
                        )
                    );
                }
                // Type validation
                if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                    await client.query('ROLLBACK');
                    return next(
                        new ValidationError(`Item ${i + 1}: quantity must be a positive number`)
                    );
                }
                if (typeof item.purchase_price !== 'number' || item.purchase_price <= 0) {
                    await client.query('ROLLBACK');
                    return next(
                        new ValidationError(
                            `Item ${i + 1}: purchase_price must be a positive number`
                        )
                    );
                }
            }

            // Purchase yaratish
            const { rows: purchaseRows } = await client.query(
                `
            INSERT INTO purchases (purchase_date, notes, total_amount)
            VALUES ($1, $2, 0)
            RETURNING id, purchase_date, total_amount, notes, created_at
        `,
                [purchase_date, notes || null]
            );

            const purchaseId = purchaseRows[0].id;
            let totalAmount = 0;

            // Purchase items yaratish
            for (const item of items) {
                const { product_id, quantity, purchase_price } = item;

                const totalPrice = quantity * purchase_price;
                totalAmount += totalPrice;

                await client.query(
                    `
                INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, total_price)
                VALUES ($1, $2, $3, $4, $5)
            `,
                    [purchaseId, product_id, quantity, purchase_price, totalPrice]
                );

                // Inventory yangilash
                await client.query(
                    `
                INSERT INTO inventory (product_id, quantity, last_updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (product_id) 
                DO UPDATE SET
                    quantity = inventory.quantity + $2,
                    last_updated_at = NOW()
            `,
                    [product_id, quantity]
                );

                // Inventory movement yozish
                const { rows: invRows } = await client.query(
                    `
                SELECT quantity FROM inventory WHERE product_id = $1
            `,
                    [product_id]
                );
                const quantityBefore = invRows.length > 0 ? invRows[0].quantity - quantity : 0;
                const quantityAfter = invRows.length > 0 ? invRows[0].quantity : quantity;

                await client.query(
                    `
                INSERT INTO inventory_movements (product_id, purchase_id, movement_type, quantity_change, quantity_before, quantity_after)
                VALUES ($1, $2, 'purchase', $3, $4, $5)
            `,
                    [product_id, purchaseId, quantity, quantityBefore, quantityAfter]
                );
            }

            // Total amount yangilash
            await client.query(
                `
            UPDATE purchases
            SET total_amount = $1
            WHERE id = $2
        `,
                [totalAmount, purchaseId]
            );

            await client.query('COMMIT');

            // To'liq ma'lumotni qaytarish
            const { rows: purchaseRows2 } = await client.query(
                `
            SELECT 
                id, purchase_date, total_amount, notes, created_at
            FROM purchases
            WHERE id = $1
        `,
                [purchaseId]
            );

            const { rows: itemsRows } = await client.query(
                `
            SELECT 
                pi.id, pi.product_id, pi.quantity, pi.purchase_price, pi.total_price,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru
            FROM purchase_items pi
            INNER JOIN products p ON pi.product_id = p.id
            WHERE pi.purchase_id = $1
        `,
                [purchaseId]
            );

            res.status(201).json({
                ...purchaseRows2[0],
                items: itemsRows,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// DELETE /api/seller/purchases/:id - Kirim o'chirish
router.delete(
    '/:id',
    validateParams({
        id: required(integer),
    }),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;

            // Purchase items'ni olish (inventory'ni qaytarish uchun)
            const { rows: itemsRows } = await client.query(
                `
            SELECT product_id, quantity
            FROM purchase_items
            WHERE purchase_id = $1
        `,
                [id]
            );

            // Inventory'ni qaytarish
            for (const item of itemsRows) {
                await client.query(
                    `
                UPDATE inventory
                SET quantity = quantity - $1,
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
                const quantityAfter = invRows.length > 0 ? invRows[0].quantity : 0;
                const quantityBefore = quantityAfter + item.quantity;

                await client.query(
                    `
                INSERT INTO inventory_movements (product_id, purchase_id, movement_type, quantity_change, quantity_before, quantity_after, notes)
                VALUES ($1, $2, 'purchase_cancellation', $3, $4, $5, 'Purchase deleted')
            `,
                    [item.product_id, id, -item.quantity, quantityBefore, quantityAfter]
                );
            }

            // Purchase o'chirish (CASCADE bilan items ham o'chadi)
            const { rows } = await client.query(
                `
            DELETE FROM purchases
            WHERE id = $1
            RETURNING id
        `,
                [id]
            );

            if (rows.length === 0) {
                await client.query('ROLLBACK');
                return next(new NotFoundError('Purchase'));
            }

            await client.query('COMMIT');
            res.json({ message: 'Purchase deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

module.exports = router;
