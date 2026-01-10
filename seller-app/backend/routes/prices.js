const express = require('express');
const pool = require('../db');
const priceService = require('../services/prices');
const migrate = require('../utils/migrate');
const router = express.Router();
const {
    validateBody,
    validateParams,
    required,
    optional,
    integer,
    positive,
    number,
} = require('../middleware/validate');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

// Cache for column existence check (to avoid running migrations on every request)
let profitabilityPercentageColumnChecked = false;
let profitabilityPercentageColumnExists = false;

// Helper function: Check if column exists, if not, run migrations
async function ensureProfitabilityPercentageColumn() {
    // If already checked and exists, return immediately
    if (profitabilityPercentageColumnChecked && profitabilityPercentageColumnExists) {
        return true;
    }

    try {
        const { rows } = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'product_prices' AND column_name = 'profitability_percentage'
        `);

        if (rows.length > 0) {
            profitabilityPercentageColumnChecked = true;
            profitabilityPercentageColumnExists = true;
            return true;
        }

        // Column doesn't exist, run migrations
        logger.warn('⚠️  profitability_percentage column not found. Running migrations...');
        try {
            const migrationResult = await migrate.runMigrations();
            logger.info('✅ Migrations completed:', migrationResult);
        } catch (migrationError) {
            logger.error('❌ Migration failed:', migrationError);
            logger.error('Migration error details:', {
                message: migrationError.message,
                stack: migrationError.stack,
                code: migrationError.code,
            });
            // Don't return false yet, check if column was created despite error
        }

        // Check again after migration
        const { rows: checkAgain } = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'product_prices' AND column_name = 'profitability_percentage'
        `);

        profitabilityPercentageColumnChecked = true;

        if (checkAgain.length > 0) {
            profitabilityPercentageColumnExists = true;
            logger.info('✅ profitability_percentage column found after migration');
            return true;
        } else {
            profitabilityPercentageColumnExists = false;
            logger.error('❌ profitability_percentage column still not found after migration');
            // Try to create the column directly as a fallback
            try {
                logger.info('🔄 Attempting to create profitability_percentage column directly...');
                await pool.query(`
                    ALTER TABLE product_prices
                    ADD COLUMN IF NOT EXISTS profitability_percentage DECIMAL(5, 2)
                `);
                logger.info('✅ Column created directly');
                profitabilityPercentageColumnExists = true;
                return true;
            } catch (directError) {
                logger.error('❌ Failed to create column directly:', directError);
                return false;
            }
        }
    } catch (error) {
        logger.error('Error checking profitability_percentage column:', error);
        profitabilityPercentageColumnChecked = true;
        profitabilityPercentageColumnExists = false;
        return false;
    }
}

// GET /api/seller/prices - Barcha narxlar
router.get('/', async (req, res) => {
    try {
        const { marketplace_id, product_id } = req.query;

        // Ensure profitability_percentage column exists
        const columnExists = await ensureProfitabilityPercentageColumn();
        if (!columnExists) {
            logger.error(
                '❌ profitability_percentage column does not exist and could not be created'
            );
            // Continue anyway, but don't select the column
        }

        // Calculate profitability instead of selecting non-existent column
        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price,
                (pp.selling_price - pp.cost_price - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) as profitability`;

        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += ', 
                CASE 
                    WHEN pp.selling_price > 0 
                    THEN ((pp.selling_price - pp.cost_price - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) / pp.selling_price * 100)
                    ELSE NULL 
                END as profitability_percentage';
        }

        selectFields += ', pp.updated_at';

        let query = `
            SELECT 
                ${selectFields},
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                p.image_url as product_image_url,
                m.name as marketplace_name, m.api_type as marketplace_type
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (marketplace_id) {
            query += ` AND pp.marketplace_id = $${paramIndex}`;
            params.push(marketplace_id);
            paramIndex++;
        }

        if (product_id) {
            query += ` AND pp.product_id = $${paramIndex}`;
            params.push(product_id);
            paramIndex++;
        }

        query += ` ORDER BY p.name_uz ASC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/seller/prices/:id - Bitta narx
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure profitability_percentage column exists
        const columnExists = await ensureProfitabilityPercentageColumn();
        if (!columnExists) {
            logger.error(
                '❌ profitability_percentage column does not exist and could not be created'
            );
        }

        // Calculate profitability instead of selecting non-existent column
        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price,
                (pp.selling_price - pp.cost_price - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) as profitability`;

        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += ', 
                CASE 
                    WHEN pp.selling_price > 0 
                    THEN ((pp.selling_price - pp.cost_price - (pp.selling_price * COALESCE(pp.commission_rate, 0) / 100)) / pp.selling_price * 100)
                    ELSE NULL 
                END as profitability_percentage';
        }

        selectFields += ', pp.updated_at';

        const { rows } = await pool.query(
            `
            SELECT 
                ${selectFields},
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                m.name as marketplace_name
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
            WHERE pp.id = $1
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        logger.error('Error fetching price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/prices - Yangi narx
router.post(
    '/',
    validateBody({
        product_id: required(integer),
        marketplace_id: optional(integer),
        cost_price: optional(positive),
        selling_price: optional(positive),
        commission_rate: optional(number),
        strikethrough_price: optional(positive),
    }),
    async (req, res, next) => {
        try {
            const {
                product_id,
                marketplace_id,
                cost_price,
                selling_price,
                commission_rate,
                strikethrough_price,
            } = req.body;

            // Rentabillikni hisoblash (miqdor va foiz)
            let profitability = null;
            let profitabilityPercentage = null;
            if (cost_price && selling_price && parseFloat(selling_price) > 0) {
                const profit = parseFloat(selling_price) - parseFloat(cost_price);
                const commission = commission_rate
                    ? (parseFloat(selling_price) * parseFloat(commission_rate)) / 100
                    : 0;
                profitability = profit - commission;
                // Rentabillik foizini hisoblash (selling_price ga nisbatan)
                profitabilityPercentage = (profitability / parseFloat(selling_price)) * 100;
            }

            // Ensure profitability_percentage column exists
            const columnExists = await ensureProfitabilityPercentageColumn();

            // Build query based on whether column exists
            let insertColumns =
                'product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price';
            let insertValues = '$1, $2, $3, $4, $5, $6';
            let updateClause = `
                cost_price = EXCLUDED.cost_price,
                selling_price = EXCLUDED.selling_price,
                commission_rate = EXCLUDED.commission_rate,
                strikethrough_price = EXCLUDED.strikethrough_price`;
            let returningClause =
                'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, updated_at';
            const params = [
                product_id,
                marketplace_id || null,
                cost_price || null,
                selling_price || null,
                commission_rate || null,
                strikethrough_price || null,
            ];

            // Add profitability if calculated
            if (profitability !== null) {
                insertColumns += ', profitability';
                insertValues += ', $7';
                updateClause += ', profitability = EXCLUDED.profitability';
                returningClause = returningClause.replace('updated_at', 'profitability, updated_at');
                params.push(profitability);
            }

            if (columnExists) {
                const paramIndex = profitability !== null ? 8 : 7;
                insertColumns += ', profitability_percentage';
                insertValues += `, $${paramIndex}`;
                updateClause += ', profitability_percentage = EXCLUDED.profitability_percentage';
                returningClause = returningClause.replace('updated_at', 'profitability_percentage, updated_at');
                params.push(profitabilityPercentage || null);
            }

            const { rows } = await pool.query(
                `
            INSERT INTO product_prices (${insertColumns})
            VALUES (${insertValues})
            ON CONFLICT (product_id, marketplace_id) 
            DO UPDATE SET
                ${updateClause},
                updated_at = NOW()
            RETURNING ${returningClause}
        `,
                params
            );

            // Rentabillikni qayta hisoblash (agar kerak bo'lsa)
            if (rows.length > 0) {
                await priceService.recalculateProfitability(product_id, marketplace_id || null);
            }

            res.status(201).json(rows[0]);
        } catch (error) {
            if (error.code === '23503') {
                return next(new NotFoundError('Product or marketplace'));
            }
            if (error.code === '23505') {
                return next(
                    new ConflictError('Price already exists for this product and marketplace')
                );
            }
            next(error);
        }
    }
);

// PUT /api/seller/prices/:id - Narx yangilash
router.put(
    '/:id',
    validateParams({
        id: required(integer),
    }),
    validateBody({
        cost_price: optional(positive),
        selling_price: optional(positive),
        commission_rate: optional(number),
        strikethrough_price: optional(positive),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

            // Rentabillikni hisoblash (miqdor va foiz)
            // Avval mavjud cost_price va selling_price ni olish
            const { rows: existingRows } = await pool.query(
                `
            SELECT cost_price, selling_price, commission_rate FROM product_prices WHERE id = $1
        `,
                [id]
            );

            let profitability = null;
            let profitabilityPercentage = null;
            const finalCostPrice =
                cost_price !== undefined ? cost_price : existingRows[0]?.cost_price;
            const finalSellingPrice =
                selling_price !== undefined ? selling_price : existingRows[0]?.selling_price;
            const finalCommissionRate =
                commission_rate !== undefined ? commission_rate : existingRows[0]?.commission_rate;

            if (finalCostPrice && finalSellingPrice && parseFloat(finalSellingPrice) > 0) {
                const profit = parseFloat(finalSellingPrice) - parseFloat(finalCostPrice);
                const commission = finalCommissionRate
                    ? (parseFloat(finalSellingPrice) * parseFloat(finalCommissionRate)) / 100
                    : 0;
                profitability = profit - commission;
                // Rentabillik foizini hisoblash (selling_price ga nisbatan)
                profitabilityPercentage = (profitability / parseFloat(finalSellingPrice)) * 100;
            }

            // Ensure profitability_percentage column exists
            const columnExists = await ensureProfitabilityPercentageColumn();

            // Build query based on whether column exists
            let updateClause = `
                cost_price = COALESCE($1, cost_price),
                selling_price = COALESCE($2, selling_price),
                commission_rate = COALESCE($3, commission_rate),
                strikethrough_price = COALESCE($4, strikethrough_price)`;
            let returningClause =
                'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, updated_at';
            let params = [
                cost_price,
                selling_price,
                commission_rate,
                strikethrough_price,
                id,
            ];

            // Add profitability if calculated
            if (profitability !== null) {
                updateClause += ', profitability = $5';
                returningClause = returningClause.replace('updated_at', 'profitability, updated_at');
                params[params.length - 1] = profitability; // Replace id
                params.push(id); // Add id back
            }

            if (columnExists) {
                const profitabilityParamIndex = profitability !== null ? 6 : 5;
                updateClause += `, profitability_percentage = COALESCE($${profitabilityParamIndex}, profitability_percentage)`;
                returningClause = returningClause.replace('updated_at', 'profitability_percentage, updated_at');
                params[params.length - 1] = profitabilityPercentage || null; // Replace last param
                if (profitability === null) {
                    params[params.length - 1] = id; // Keep id
                    params.push(profitabilityPercentage || null); // Add profitability_percentage
                    params.push(id); // Add id back
                } else {
                    params.push(profitabilityPercentage || null); // Add profitability_percentage
                    params.push(id); // Add id back
                }
            }

            const { rows } = await pool.query(
                `
            UPDATE product_prices
            SET 
                ${updateClause},
                updated_at = NOW()
            WHERE id = $${params.length}
            RETURNING ${returningClause}
        `,
                params
            );

            // Rentabillikni qayta hisoblash (agar kerak bo'lsa)
            if (rows.length > 0) {
                await priceService.recalculateProfitability(
                    rows[0].product_id,
                    rows[0].marketplace_id
                );
                // Yangilangan ma'lumotlarni qayta olish
                let selectCols =
                    'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at';
                if (columnExists) {
                    selectCols =
                        'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, profitability_percentage, updated_at';
                }
                const { rows: updatedRows } = await pool.query(
                    `
                SELECT ${selectCols} FROM product_prices WHERE id = $1
            `,
                    [id]
                );
                if (updatedRows.length > 0) {
                    return res.json(updatedRows[0]);
                }
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Price not found' });
            }

            res.json(rows[0]);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/seller/prices/:id - Narx o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            `
            DELETE FROM product_prices
            WHERE id = $1
            RETURNING id
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json({ message: 'Price deleted successfully' });
    } catch (error) {
        logger.error('Error deleting price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
