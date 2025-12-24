const express = require('express');
const pool = require('../db');
const priceService = require('../services/prices');
const migrate = require('../utils/migrate');
const router = express.Router();

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
        console.log('⚠️  profitability_percentage column not found. Running migrations...');
        try {
            const migrationResult = await migrate.runMigrations();
            console.log('✅ Migrations completed:', migrationResult);
        } catch (migrationError) {
            console.error('❌ Migration failed:', migrationError);
            console.error('Migration error details:', {
                message: migrationError.message,
                stack: migrationError.stack,
                code: migrationError.code
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
            console.log('✅ profitability_percentage column found after migration');
            return true;
        } else {
            profitabilityPercentageColumnExists = false;
            console.error('❌ profitability_percentage column still not found after migration');
            // Try to create the column directly as a fallback
            try {
                console.log('🔄 Attempting to create profitability_percentage column directly...');
                await pool.query(`
                    ALTER TABLE product_prices
                    ADD COLUMN IF NOT EXISTS profitability_percentage DECIMAL(5, 2)
                `);
                console.log('✅ Column created directly');
                profitabilityPercentageColumnExists = true;
                return true;
            } catch (directError) {
                console.error('❌ Failed to create column directly:', directError);
                return false;
            }
        }
    } catch (error) {
        console.error('Error checking profitability_percentage column:', error);
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
            console.error('❌ profitability_percentage column does not exist and could not be created');
            // Continue anyway, but don't select the column
        }

        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price, pp.profitability`;
        
        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += ', NULL as profitability_percentage';
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
        console.error('Error fetching prices:', error);
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
            console.error('❌ profitability_percentage column does not exist and could not be created');
        }

        let selectFields = `
                pp.id, pp.product_id, pp.marketplace_id,
                pp.cost_price, pp.selling_price, pp.commission_rate,
                pp.strikethrough_price, pp.profitability`;
        
        // Only add profitability_percentage if column exists
        if (columnExists) {
            selectFields += ', pp.profitability_percentage';
        } else {
            selectFields += ', NULL as profitability_percentage';
        }
        
        selectFields += ', pp.updated_at';

        const { rows } = await pool.query(`
            SELECT 
                ${selectFields},
                p.name_uz as product_name_uz, p.name_ru as product_name_ru,
                m.name as marketplace_name
            FROM product_prices pp
            INNER JOIN products p ON pp.product_id = p.id
            LEFT JOIN marketplaces m ON pp.marketplace_id = m.id
            WHERE pp.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/seller/prices - Yangi narx
router.post('/', async (req, res) => {
    try {
        const { product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        // Rentabillikni hisoblash (miqdor va foiz)
        let profitability = null;
        let profitabilityPercentage = null;
        if (cost_price && selling_price && parseFloat(selling_price) > 0) {
            const profit = parseFloat(selling_price) - parseFloat(cost_price);
            const commission = commission_rate ? (parseFloat(selling_price) * parseFloat(commission_rate) / 100) : 0;
            profitability = profit - commission;
            // Rentabillik foizini hisoblash (selling_price ga nisbatan)
            profitabilityPercentage = (profitability / parseFloat(selling_price)) * 100;
        }

        // Ensure profitability_percentage column exists
        const columnExists = await ensureProfitabilityPercentageColumn();
        
        // Build query based on whether column exists
        let insertColumns = 'product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability';
        let insertValues = '$1, $2, $3, $4, $5, $6, $7';
        let updateClause = `
                cost_price = EXCLUDED.cost_price,
                selling_price = EXCLUDED.selling_price,
                commission_rate = EXCLUDED.commission_rate,
                strikethrough_price = EXCLUDED.strikethrough_price,
                profitability = EXCLUDED.profitability`;
        let returningClause = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at';
        let params = [product_id, marketplace_id || null, cost_price || null, selling_price || null, commission_rate || null, strikethrough_price || null, profitability];
        
        if (columnExists) {
            insertColumns += ', profitability_percentage';
            insertValues += ', $8';
            updateClause += ', profitability_percentage = EXCLUDED.profitability_percentage';
            returningClause = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, profitability_percentage, updated_at';
            params.push(profitabilityPercentage);
        }

        const { rows } = await pool.query(`
            INSERT INTO product_prices (${insertColumns})
            VALUES (${insertValues})
            ON CONFLICT (product_id, marketplace_id) 
            DO UPDATE SET
                ${updateClause},
                updated_at = NOW()
            RETURNING ${returningClause}
        `, params);

        // Rentabillikni qayta hisoblash (agar kerak bo'lsa)
        if (rows.length > 0) {
            await priceService.recalculateProfitability(product_id, marketplace_id || null);
        }

        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Product or marketplace not found' });
        }
        console.error('Error creating price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/seller/prices/:id - Narx yangilash
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cost_price, selling_price, commission_rate, strikethrough_price } = req.body;

        // Rentabillikni hisoblash (miqdor va foiz)
        // Avval mavjud cost_price va selling_price ni olish
        const { rows: existingRows } = await pool.query(`
            SELECT cost_price, selling_price, commission_rate FROM product_prices WHERE id = $1
        `, [id]);
        
        let profitability = null;
        let profitabilityPercentage = null;
        const finalCostPrice = cost_price !== undefined ? cost_price : existingRows[0]?.cost_price;
        const finalSellingPrice = selling_price !== undefined ? selling_price : existingRows[0]?.selling_price;
        const finalCommissionRate = commission_rate !== undefined ? commission_rate : existingRows[0]?.commission_rate;
        
        if (finalCostPrice && finalSellingPrice && parseFloat(finalSellingPrice) > 0) {
            const profit = parseFloat(finalSellingPrice) - parseFloat(finalCostPrice);
            const commission = finalCommissionRate ? (parseFloat(finalSellingPrice) * parseFloat(finalCommissionRate) / 100) : 0;
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
                strikethrough_price = COALESCE($4, strikethrough_price),
                profitability = COALESCE($5, profitability)`;
        let returningClause = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at';
        let params = [cost_price, selling_price, commission_rate, strikethrough_price, profitability, id];
        
        if (columnExists) {
            updateClause += ', profitability_percentage = COALESCE($6, profitability_percentage)';
            returningClause = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, profitability_percentage, updated_at';
            params = [cost_price, selling_price, commission_rate, strikethrough_price, profitability, profitabilityPercentage, id];
        }

        const { rows } = await pool.query(`
            UPDATE product_prices
            SET 
                ${updateClause},
                updated_at = NOW()
            WHERE id = $${params.length}
            RETURNING ${returningClause}
        `, params);

        // Rentabillikni qayta hisoblash (agar kerak bo'lsa)
        if (rows.length > 0) {
            await priceService.recalculateProfitability(rows[0].product_id, rows[0].marketplace_id);
            // Yangilangan ma'lumotlarni qayta olish
            let selectCols = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, updated_at';
            if (columnExists) {
                selectCols = 'id, product_id, marketplace_id, cost_price, selling_price, commission_rate, strikethrough_price, profitability, profitability_percentage, updated_at';
            }
            const { rows: updatedRows } = await pool.query(`
                SELECT ${selectCols} FROM product_prices WHERE id = $1
            `, [id]);
            if (updatedRows.length > 0) {
                return res.json(updatedRows[0]);
            }
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/seller/prices/:id - Narx o'chirish
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(`
            DELETE FROM product_prices
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Price not found' });
        }

        res.json({ message: 'Price deleted successfully' });
    } catch (error) {
        console.error('Error deleting price:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

