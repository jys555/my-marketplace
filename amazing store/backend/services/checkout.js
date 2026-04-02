const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Split a multi-seller cart into per-seller orders and link to a marketplace order.
 * Expects cartItems: [{ product_id, seller_id, quantity, unit_price_cents }]
 */
async function splitCartAndCreateOrders({ customerId, cartItems }) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Cart is empty');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Group items by seller_id
        const bySeller = new Map();
        for (const it of cartItems) {
            if (!bySeller.has(it.seller_id)) bySeller.set(it.seller_id, []);
            bySeller.get(it.seller_id).push(it);
        }

        // Aggregate totals
        let marketplaceSubtotal = 0;
        let marketplaceDelivery = 0; // compute later if needed
        let marketplaceTotal = 0;

        const createdOrders = [];

        for (const [sellerId, items] of bySeller.entries()) {
            let subtotal = 0;
            for (const it of items) {
                subtotal += it.unit_price_cents * it.quantity;
            }
            const deliveryFee = 0; // inject pricing rules here
            const total = subtotal + deliveryFee;

            // Create per-seller order
            const orderRes = await client.query(
                `
                INSERT INTO orders (seller_id, customer_id, status, subtotal_cents, delivery_fee_cents, total_cents, payment_status)
                VALUES ($1, $2, 'pending', $3, $4, $5, 'unpaid')
                RETURNING id
                `,
                [sellerId, customerId, subtotal, deliveryFee, total]
            );
            const orderId = orderRes.rows[0].id;

            // Insert items
            for (const it of items) {
                const lineTotal = it.unit_price_cents * it.quantity;
                await client.query(
                    `
                    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_cents, total_cents)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    `,
                    [orderId, it.product_id, sellerId, it.quantity, it.unit_price_cents, lineTotal]
                );
            }

            createdOrders.push({ orderId, sellerId, subtotal, deliveryFee, total });
            marketplaceSubtotal += subtotal;
            marketplaceDelivery += deliveryFee;
            marketplaceTotal += total;
        }

        // Create marketplace order
        const moRes = await client.query(
            `
            INSERT INTO marketplace_orders (customer_id, status, subtotal_cents, delivery_fee_cents, total_cents, payment_status)
            VALUES ($1, 'processing', $2, $3, $4, 'unpaid')
            RETURNING id
            `,
            [customerId, marketplaceSubtotal, marketplaceDelivery, marketplaceTotal]
        );
        const marketplaceOrderId = moRes.rows[0].id;

        // Link each seller order
        for (const o of createdOrders) {
            await client.query(
                `
                INSERT INTO marketplace_order_links (marketplace_order_id, order_id, seller_id)
                VALUES ($1, $2, $3)
                `,
                [marketplaceOrderId, o.orderId, o.sellerId]
            );
        }

        await client.query('COMMIT');

        return {
            marketplaceOrderId,
            orders: createdOrders,
        };
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Cart split & order creation failed:', e);
        throw e;
    } finally {
        client.release();
    }
}

module.exports = {
    splitCartAndCreateOrders,
};

