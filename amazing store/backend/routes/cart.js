/**
 * Cart Routes - Amazing Store
 * Shopping cart management API
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/cart
 * Foydalanuvchining savatidagi barcha mahsulotlarni olish
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await db.query(
            `SELECT 
                ci.id,
                ci.product_id,
                ci.quantity,
                ci.price_snapshot,
                ci.created_at,
                p.name_uz,
                p.name_ru,
                p.price,
                p.sale_price,
                p.image_url,
                p.sku
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = $1
            ORDER BY ci.created_at DESC`,
            [userId]
        );

        // Calculate totals
        const items = result.rows;
        const totalAmount = items.reduce((sum, item) => {
            const price = item.price_snapshot || item.sale_price || item.price;
            return sum + (price * item.quantity);
        }, 0);

        logger.info('Cart retrieved successfully', {
            service: 'amazing-store-backend',
            userId,
            itemCount: items.length,
        });

        res.json({
            items,
            summary: {
                totalItems: items.length,
                totalAmount: Number(totalAmount).toFixed(2),
            },
        });
    } catch (error) {
        logger.error('Error fetching cart', {
            service: 'amazing-store-backend',
            error: error.message,
        });
        next(error);
    }
});

/**
 * POST /api/cart
 * Savatga mahsulot qo'shish yoki miqdorni yangilash
 * Body: { product_id, quantity }
 */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const { product_id, quantity = 1 } = req.body;

        if (!product_id || quantity < 1) {
            return res.status(400).json({ error: 'Invalid product_id or quantity' });
        }

        // Check if product exists
        const productCheck = await db.query('SELECT id FROM products WHERE id = $1', [
            product_id,
        ]);

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get current price for price_snapshot
        const priceResult = await db.query(
            'SELECT COALESCE(sale_price, price) as current_price FROM products WHERE id = $1',
            [product_id]
        );
        const priceSnapshot = priceResult.rows[0]?.current_price || 0;

        // Upsert (insert or update)
        const result = await db.query(
            `INSERT INTO cart_items (user_id, product_id, quantity, price_snapshot)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET 
                quantity = EXCLUDED.quantity,
                price_snapshot = EXCLUDED.price_snapshot,
                updated_at = NOW()
            RETURNING *`,
            [userId, product_id, quantity, priceSnapshot]
        );

        logger.info('Product added to cart', {
            service: 'amazing-store-backend',
            userId,
            productId: product_id,
            quantity,
        });

        res.status(201).json({
            message: 'Product added to cart',
            item: result.rows[0],
        });
    } catch (error) {
        logger.error('Error adding to cart', {
            service: 'amazing-store-backend',
            error: error.message,
        });
        next(error);
    }
});

/**
 * PATCH /api/cart/:id
 * Savat elementini yangilash (quantity only)
 * Body: { quantity }
 */
router.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const cartItemId = req.params.id;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({ error: 'Quantity is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const result = await db.query(
            `UPDATE cart_items
            SET quantity = $3, updated_at = NOW()
            WHERE id = $2 AND user_id = $1
            RETURNING *`,
            [userId, cartItemId, quantity]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        logger.info('Cart item updated', {
            service: 'amazing-store-backend',
            userId,
            cartItemId,
            quantity,
        });

        res.json({
            message: 'Cart item updated',
            item: result.rows[0],
        });
    } catch (error) {
        logger.error('Error updating cart item', {
            service: 'amazing-store-backend',
            error: error.message,
        });
        next(error);
    }
});

/**
 * DELETE /api/cart/:id
 * Savatdan mahsulotni o'chirish
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const cartItemId = req.params.id;

        const result = await db.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
            [cartItemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        logger.info('Cart item deleted', {
            service: 'amazing-store-backend',
            userId,
            cartItemId,
        });

        res.json({ message: 'Cart item deleted' });
    } catch (error) {
        logger.error('Error deleting cart item', {
            service: 'amazing-store-backend',
            error: error.message,
        });
        next(error);
    }
});

/**
 * DELETE /api/cart
 * Savatni butunlay tozalash
 */
router.delete('/', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await db.query('DELETE FROM cart_items WHERE user_id = $1 RETURNING id', [
            userId,
        ]);

        logger.info('Cart cleared', {
            service: 'amazing-store-backend',
            userId,
            deletedCount: result.rowCount,
        });

        res.json({
            message: 'Cart cleared',
            deletedCount: result.rowCount,
        });
    } catch (error) {
        logger.error('Error clearing cart', {
            service: 'amazing-store-backend',
            error: error.message,
        });
        next(error);
    }
});

module.exports = router;

