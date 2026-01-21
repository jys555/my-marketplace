const express = require('express');
const pool = require('../db');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/seller/analytics/dashboard - Dashboard ma'lumotlari (faqat Amazing Store)
router.get('/dashboard', async (req, res) => {
    try {
        const { month, year } = req.query;

        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        // Daily analytics olish (faqat Amazing Store - marketplace_id IS NULL)
        let dailyQuery = `
            SELECT 
                date, total_orders, total_revenue, total_profit
            FROM daily_analytics
            WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
            AND marketplace_id IS NULL
            ORDER BY date ASC
        `;
        const dailyParams = [targetMonth, targetYear];

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

        res.json({
            daily: dailyRows,
            monthly: {
                total_orders: parseInt(monthlyRows[0]?.total_orders || 0),
                total_revenue: parseFloat(monthlyRows[0]?.total_revenue || 0),
                total_profit: parseFloat(monthlyRows[0]?.total_profit || 0),
            },
        });
    } catch (error) {
        logger.error('Error fetching dashboard analytics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/analytics/daily - Kunlik analitika (faqat Amazing Store)
router.get('/daily', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                date, marketplace_id,
                total_orders, total_revenue, total_cost, total_profit,
                created_at, updated_at
            FROM daily_analytics
            WHERE marketplace_id IS NULL
        `;
        const params = [];
        let paramIndex = 1;

        if (start_date) {
            query += ` AND date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY date DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching daily analytics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/analytics/products - Tovar bo'yicha analitika (faqat Amazing Store)
router.get('/products', async (req, res) => {
    try {
        const { product_id, start_date, end_date } = req.query;

        let query = `
            SELECT 
                pa.product_id, pa.marketplace_id,
                pa.date, pa.orders_count, pa.quantity_sold, pa.quantity_returned,
                pa.revenue, pa.cost, pa.profit,
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                'AMAZING_STORE' as marketplace_name
            FROM product_analytics pa
            INNER JOIN products p ON pa.product_id = p.id
            WHERE pa.marketplace_id IS NULL
        `;
        const params = [];
        let paramIndex = 1;

        if (product_id) {
            query += ` AND pa.product_id = $${paramIndex}`;
            params.push(product_id);
            paramIndex++;
        }

        if (start_date) {
            query += ` AND pa.date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND pa.date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY pa.date DESC, p.name_uz ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching product analytics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
