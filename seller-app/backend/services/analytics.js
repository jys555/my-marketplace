const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Analytics service
 * Analitika hisoblash va ma'lumotlarni yig'ish
 */
class AnalyticsService {
    /**
     * Dashboard ma'lumotlarini olish
     * @param {number} marketplaceId - Marketplace ID (null = barcha)
     * @param {number} month - Oy (1-12)
     * @param {number} year - Yil
     * @returns {Promise<Object>} - Dashboard ma'lumotlari
     */
    async getDashboardData(marketplaceId = null, month = null, year = null) {
        try {
            const targetMonth = month || new Date().getMonth() + 1;
            const targetYear = year || new Date().getFullYear();

            // Daily analytics olish
            let dailyQuery = `
                SELECT 
                    date, total_orders, total_revenue, total_profit
                FROM daily_analytics
                WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
            `;
            const dailyParams = [targetMonth, targetYear];

            if (marketplaceId) {
                dailyQuery += ` AND marketplace_id = $3`;
                dailyParams.push(marketplaceId);
            } else {
                dailyQuery += ` AND marketplace_id IS NULL`;
            }

            dailyQuery += ` ORDER BY date ASC`;

            const { rows: dailyRows } = await pool.query(dailyQuery, dailyParams);

            // Monthly totals (faqat Amazing Store - marketplace_id IS NULL)
            let monthlyQuery = `
                SELECT 
                    SUM(total_orders) as total_orders,
                    SUM(total_revenue) as total_revenue,
                    SUM(total_profit) as total_profit
                FROM daily_analytics
                WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
                AND marketplace_id IS NULL
            `;
            const monthlyParams = [targetMonth, targetYear];

            const { rows: monthlyRows } = await pool.query(monthlyQuery, monthlyParams);

            return {
                daily: dailyRows.map(row => ({
                    date: row.date,
                    orders_count: parseInt(row.total_orders || 0),
                    orders_sum: parseFloat(row.total_revenue || 0),
                    profit: parseFloat(row.total_profit || 0),
                })),
                monthly: {
                    total_orders: parseInt(monthlyRows[0]?.total_orders || 0),
                    total_revenue: parseFloat(monthlyRows[0]?.total_revenue || 0),
                    total_profit: parseFloat(monthlyRows[0]?.total_profit || 0),
                },
            };
        } catch (error) {
            logger.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    /**
     * Kunlik analitikani hisoblash va saqlash (faqat Amazing Store)
     * @param {Date} date - Sana
     * @returns {Promise<Object>} - Daily analytics
     */
    async calculateDailyAnalytics(date) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dateStr = date.toISOString().split('T')[0];

            // Buyurtmalarni olish (faqat Amazing Store - marketplace_id IS NULL)
            let ordersQuery = `
                SELECT 
                    COUNT(*) as orders_count,
                    SUM(total_amount) as total_revenue,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
                FROM orders
                WHERE DATE(order_date) = $1
                AND marketplace_id IS NULL
            `;
            const ordersParams = [dateStr];

            const { rows: ordersRows } = await client.query(ordersQuery, ordersParams);

            // Order items'ni olish (cost va profit hisoblash uchun)
            // Order items olish (faqat Amazing Store - marketplace_id IS NULL)
            let itemsQuery = `
                SELECT 
                    oi.product_id, oi.quantity, oi.price,
                    p.cost_price
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE DATE(o.order_date) = $1 AND o.status != 'cancelled'
                AND o.marketplace_id IS NULL
            `;
            const itemsParams = [dateStr];

            const { rows: itemsRows } = await client.query(itemsQuery, itemsParams);

            // Cost va profit hisoblash
            let totalCost = 0;
            const totalRevenue = parseFloat(ordersRows[0]?.total_revenue || 0);

            for (const item of itemsRows) {
                const costPrice = parseFloat(item.cost_price || 0);
                totalCost += costPrice * parseInt(item.quantity);
            }

            const totalProfit = totalRevenue - totalCost;
            const totalOrders = parseInt(ordersRows[0]?.orders_count || 0);

            // Daily analytics'ni saqlash yoki yangilash
            const { rows: analyticsRows } = await client.query(
                `
                INSERT INTO daily_analytics (
                    date, marketplace_id, total_orders, total_revenue, total_cost, total_profit
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (date, marketplace_id)
                DO UPDATE SET
                    total_orders = EXCLUDED.total_orders,
                    total_revenue = EXCLUDED.total_revenue,
                    total_cost = EXCLUDED.total_cost,
                    total_profit = EXCLUDED.total_profit,
                    updated_at = NOW()
                RETURNING *
            `,
                [dateStr, null, totalOrders, totalRevenue, totalCost, totalProfit]
            );

            await client.query('COMMIT');
            return analyticsRows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error calculating daily analytics:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tovar bo'yicha analitika (faqat Amazing Store)
     * @param {number} productId - Product ID
     * @param {Date} startDate - Boshlanish sanasi
     * @param {Date} endDate - Tugash sanasi
     * @returns {Promise<Array>} - Product analytics
     */
    async getProductAnalytics(productId, startDate = null, endDate = null) {
        try {
            let query = `
                SELECT 
                    pa.product_id, pa.marketplace_id,
                    pa.date, pa.orders_count, pa.quantity_sold, pa.quantity_returned,
                    pa.revenue, pa.cost, pa.profit,
                    p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                    CASE 
                        WHEN pa.marketplace_id IS NULL THEN 'AMAZING_STORE'
                        ELSE 'Unknown'
                    END as marketplace_name
                FROM product_analytics pa
                INNER JOIN products p ON pa.product_id = p.id
                WHERE pa.product_id = $1
            `;
            const params = [productId];
            let paramIndex = 2;

            // Faqat Amazing Store (marketplace_id IS NULL)
            query += ` AND pa.marketplace_id IS NULL`;

            if (startDate) {
                query += ` AND pa.date >= $${paramIndex}`;
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                query += ` AND pa.date <= $${paramIndex}`;
                params.push(endDate);
                paramIndex++;
            }

            query += ` ORDER BY pa.date DESC, p.name_uz ASC`;

            const { rows } = await pool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error getting product analytics:', error);
            throw error;
        }
    }

    /**
     * Tovar bo'yicha analitikani hisoblash va saqlash (faqat Amazing Store)
     * @param {number} productId - Product ID
     * @param {Date} date - Sana
     * @returns {Promise<Object>} - Product analytics
     */
    async calculateProductAnalytics(productId, date) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dateStr = date.toISOString().split('T')[0];

            // Order items'ni olish
            let itemsQuery = `
                SELECT 
                    oi.quantity, oi.price,
                    o.status,
                    p.cost_price
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.product_id = $1 AND DATE(o.order_date) = $2
            `;
            const itemsParams = [productId, dateStr];

            // Faqat Amazing Store (marketplace_id IS NULL)
            itemsQuery += ` AND o.marketplace_id IS NULL`;

            const { rows: itemsRows } = await client.query(itemsQuery, itemsParams);

            // Hisoblash
            let ordersCount = 0;
            let quantitySold = 0;
            let quantityReturned = 0;
            let revenue = 0;
            let cost = 0;

            for (const item of itemsRows) {
                if (item.status === 'cancelled') {
                    quantityReturned += parseInt(item.quantity);
                } else {
                    ordersCount++;
                    quantitySold += parseInt(item.quantity);
                    revenue += parseFloat(item.price) * parseInt(item.quantity);
                    const costPrice = parseFloat(item.cost_price || 0);
                    cost += costPrice * parseInt(item.quantity);
                }
            }

            const profit = revenue - cost;

            // Product analytics'ni saqlash yoki yangilash
            const { rows: analyticsRows } = await client.query(
                `
                INSERT INTO product_analytics (
                    product_id, marketplace_id, date,
                    orders_count, quantity_sold, quantity_returned,
                    revenue, cost, profit
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (product_id, marketplace_id, date)
                DO UPDATE SET
                    orders_count = EXCLUDED.orders_count,
                    quantity_sold = EXCLUDED.quantity_sold,
                    quantity_returned = EXCLUDED.quantity_returned,
                    revenue = EXCLUDED.revenue,
                    cost = EXCLUDED.cost,
                    profit = EXCLUDED.profit
                RETURNING *
            `,
                [
                    productId,
                    null, // marketplace_id IS NULL (Amazing Store)
                    dateStr,
                    ordersCount,
                    quantitySold,
                    quantityReturned,
                    revenue,
                    cost,
                    profit,
                ]
            );

            await client.query('COMMIT');
            return analyticsRows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error calculating product analytics:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Barcha analitikalarni qayta hisoblash (cron job uchun)
     * @param {Date} date - Sana
     * @returns {Promise<Object>} - Recalculation result
     */
    async recalculateAnalytics(date) {
        try {
            const results = {
                daily: [],
                products: [],
            };

            // Faqat Amazing Store analitikasi
            const dailyAll = await this.calculateDailyAnalytics(date);
            results.daily.push(dailyAll);

            // Tovar analitikalari (faqat Amazing Store)
            const { rows: products } = await pool.query(
                `
                SELECT DISTINCT product_id FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                WHERE DATE(o.order_date) = $1
                AND o.marketplace_id IS NULL
            `,
                [date.toISOString().split('T')[0]]
            );

            for (const product of products) {
                const productAnalytics = await this.calculateProductAnalytics(
                    product.product_id,
                    date
                );
                results.products.push(productAnalytics);
            }

            return results;
        } catch (error) {
            logger.error('Error recalculating analytics:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
