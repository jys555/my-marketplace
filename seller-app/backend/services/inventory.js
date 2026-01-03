const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Inventory management service
 * Ombor boshqaruvi, qoldiqlar, harakatlar
 */
class InventoryService {
    /**
     * Tovar qoldig'ini olish
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} - Inventory ma'lumotlari
     */
    async getInventory(productId) {
        try {
            const { rows } = await pool.query(
                `
                SELECT 
                    i.id, i.product_id, i.quantity, i.reserved_quantity,
                    i.last_updated_at, i.created_at,
                    p.name_uz as product_name_uz, p.name_ru as product_name_ru
                FROM inventory i
                INNER JOIN products p ON i.product_id = p.id
                WHERE i.product_id = $1
            `,
                [productId]
            );

            if (rows.length === 0) {
                // Agar inventory yo'q bo'lsa, 0 qoldiq bilan yaratish
                return {
                    product_id: productId,
                    quantity: 0,
                    reserved_quantity: 0,
                    available_quantity: 0,
                };
            }

            const inventory = rows[0];
            return {
                ...inventory,
                available_quantity: inventory.quantity - inventory.reserved_quantity,
            };
        } catch (error) {
            logger.error('Error getting inventory:', error);
            throw error;
        }
    }

    /**
     * Barcha tovarlar qoldig'ini olish
     * @param {number} marketplaceId - Marketplace ID (optional)
     * @returns {Promise<Array>} - Inventory ro'yxati
     */
    async getAllInventory(marketplaceId = null) {
        try {
            let query = `
                SELECT 
                    i.id, i.product_id, i.quantity, i.reserved_quantity,
                    i.last_updated_at, i.created_at,
                    p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                    p.image_url as product_image_url,
                    p.price, p.sale_price
                FROM inventory i
                INNER JOIN products p ON i.product_id = p.id
                WHERE 1=1
            `;
            const params = [];

            // Marketplace bo'yicha filter (keyinroq qo'shiladi)
            // Hozircha barcha tovarlar

            query += ` ORDER BY p.name_uz ASC`;

            const { rows } = await pool.query(query, params);
            return rows.map(inv => ({
                ...inv,
                available_quantity: inv.quantity - inv.reserved_quantity,
            }));
        } catch (error) {
            logger.error('Error getting all inventory:', error);
            throw error;
        }
    }

    /**
     * Omborga kirim (purchase)
     * @param {number} productId - Product ID
     * @param {number} quantity - Miqdor
     * @param {number} purchaseId - Purchase ID (optional)
     * @returns {Promise<Object>} - Yangilangan inventory
     */
    async addInventory(productId, quantity, purchaseId = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Eski qoldiqni olish
            const { rows: oldRows } = await client.query(
                `
                SELECT quantity FROM inventory WHERE product_id = $1
            `,
                [productId]
            );

            const quantityBefore = oldRows.length > 0 ? oldRows[0].quantity : 0;
            const quantityAfter = quantityBefore + quantity;

            // Inventory yangilash
            const { rows } = await client.query(
                `
                INSERT INTO inventory (product_id, quantity, last_updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (product_id) 
                DO UPDATE SET
                    quantity = inventory.quantity + $2,
                    last_updated_at = NOW()
                RETURNING id, product_id, quantity, reserved_quantity, last_updated_at
            `,
                [productId, quantity]
            );

            // Inventory movement yozish
            await client.query(
                `
                INSERT INTO inventory_movements (
                    product_id, purchase_id, movement_type,
                    quantity_change, quantity_before, quantity_after,
                    notes
                )
                VALUES ($1, $2, 'purchase', $3, $4, $5, 'Purchase added')
            `,
                [productId, purchaseId, quantity, quantityBefore, quantityAfter]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error adding inventory:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Ombor'dan chiqim (sale)
     * @param {number} productId - Product ID
     * @param {number} quantity - Miqdor
     * @param {number} orderId - Order ID (optional)
     * @returns {Promise<Object>} - Yangilangan inventory
     */
    async subtractInventory(productId, quantity, orderId = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Eski qoldiqni olish
            const { rows: oldRows } = await client.query(
                `
                SELECT quantity, reserved_quantity FROM inventory WHERE product_id = $1
            `,
                [productId]
            );

            if (oldRows.length === 0) {
                throw new Error('Inventory not found');
            }

            const quantityBefore = oldRows[0].quantity;
            const reservedBefore = oldRows[0].reserved_quantity;

            if (quantityBefore < quantity) {
                throw new Error('Insufficient inventory');
            }

            const quantityAfter = quantityBefore - quantity;
            const reservedAfter = Math.max(0, reservedBefore - quantity);

            // Inventory yangilash
            const { rows } = await client.query(
                `
                UPDATE inventory
                SET 
                    quantity = $1,
                    reserved_quantity = $2,
                    last_updated_at = NOW()
                WHERE product_id = $3
                RETURNING id, product_id, quantity, reserved_quantity, last_updated_at
            `,
                [quantityAfter, reservedAfter, productId]
            );

            // Inventory movement yozish
            await client.query(
                `
                INSERT INTO inventory_movements (
                    product_id, order_id, movement_type,
                    quantity_change, quantity_before, quantity_after,
                    notes
                )
                VALUES ($1, $2, 'sale', $3, $4, $5, 'Order processed')
            `,
                [productId, orderId, -quantity, quantityBefore, quantityAfter]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error subtracting inventory:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tovar qoldig'ini rezerv qilish
     * @param {number} productId - Product ID
     * @param {number} quantity - Miqdor
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} - Yangilangan inventory
     */
    async reserveInventory(productId, quantity, orderId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Eski qoldiqni olish
            const { rows: oldRows } = await client.query(
                `
                SELECT quantity, reserved_quantity FROM inventory WHERE product_id = $1
            `,
                [productId]
            );

            if (oldRows.length === 0) {
                throw new Error('Inventory not found');
            }

            const availableQuantity = oldRows[0].quantity - oldRows[0].reserved_quantity;
            if (availableQuantity < quantity) {
                throw new Error('Insufficient available inventory');
            }

            const reservedAfter = oldRows[0].reserved_quantity + quantity;

            // Inventory yangilash
            const { rows } = await client.query(
                `
                UPDATE inventory
                SET 
                    reserved_quantity = $1,
                    last_updated_at = NOW()
                WHERE product_id = $2
                RETURNING id, product_id, quantity, reserved_quantity, last_updated_at
            `,
                [reservedAfter, productId]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error reserving inventory:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tovar qoldig'ini tuzatish (manual adjustment)
     * @param {number} productId - Product ID
     * @param {number} quantity - Yangi miqdor
     * @param {string} notes - Izoh
     * @returns {Promise<Object>} - Yangilangan inventory
     */
    async adjustInventory(productId, quantity, notes = 'Manual adjustment') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Eski qoldiqni olish
            const { rows: oldRows } = await client.query(
                `
                SELECT quantity FROM inventory WHERE product_id = $1
            `,
                [productId]
            );

            const quantityBefore = oldRows.length > 0 ? oldRows[0].quantity : 0;
            const quantityChange = quantity - quantityBefore;

            // Inventory yangilash
            const { rows } = await client.query(
                `
                INSERT INTO inventory (product_id, quantity, last_updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (product_id) 
                DO UPDATE SET
                    quantity = $2,
                    last_updated_at = NOW()
                RETURNING id, product_id, quantity, reserved_quantity, last_updated_at
            `,
                [productId, quantity]
            );

            // Inventory movement yozish
            await client.query(
                `
                INSERT INTO inventory_movements (
                    product_id, movement_type,
                    quantity_change, quantity_before, quantity_after,
                    notes
                )
                VALUES ($1, 'adjustment', $2, $3, $4, $5)
            `,
                [productId, quantityChange, quantityBefore, quantity, notes]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error adjusting inventory:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tovar harakatlarini olish
     * @param {number} productId - Product ID
     * @param {number} limit - Limit
     * @returns {Promise<Array>} - Inventory movements
     */
    async getInventoryMovements(productId, limit = 50) {
        try {
            const { rows } = await pool.query(
                `
                SELECT 
                    im.id, im.movement_type, im.quantity_change,
                    im.quantity_before, im.quantity_after, im.notes,
                    im.created_at,
                    p.name_uz as product_name_uz
                FROM inventory_movements im
                INNER JOIN products p ON im.product_id = p.id
                WHERE im.product_id = $1
                ORDER BY im.created_at DESC
                LIMIT $2
            `,
                [productId, limit]
            );

            return rows;
        } catch (error) {
            logger.error('Error getting inventory movements:', error);
            throw error;
        }
    }
}

module.exports = new InventoryService();
