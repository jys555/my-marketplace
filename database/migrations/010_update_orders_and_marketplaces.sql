-- ============================================
-- UPDATE ORDERS AND MARKETPLACES TABLES
-- ============================================
-- Migration version: 010
-- Adds missing columns to orders and marketplaces tables
-- that are required by the current Amazing Store codebase
-- Uses ADD COLUMN IF NOT EXISTS for idempotency
-- ============================================

-- 1. Update orders table - add new pricing columns
DO $$
BEGIN
    -- Add subtotal column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal NUMERIC(10,2);
        RAISE NOTICE '✅ Added subtotal column to orders';
    END IF;

    -- Add delivery_fee column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_fee'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added delivery_fee column to orders';
    END IF;

    -- Add total column (separate from total_amount for new schema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total'
    ) THEN
        ALTER TABLE orders ADD COLUMN total NUMERIC(10,2);
        -- Migrate existing data from total_amount to total
        UPDATE orders SET total = total_amount WHERE total IS NULL AND total_amount IS NOT NULL;
        RAISE NOTICE '✅ Added total column to orders';
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
        RAISE NOTICE '✅ Added payment_status column to orders';
    END IF;

    -- Add total_cost column (for analytics)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_cost NUMERIC(10,2);
        RAISE NOTICE '✅ Added total_cost column to orders';
    END IF;

    -- Add total_profit column (for analytics)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_profit'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_profit NUMERIC(10,2);
        RAISE NOTICE '✅ Added total_profit column to orders';
    END IF;

    -- Add confirmed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMP;
        RAISE NOTICE '✅ Added confirmed_at column to orders';
    END IF;

    -- Add delivered_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE '✅ Added delivered_at column to orders';
    END IF;

    -- Add cancelled_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP;
        RAISE NOTICE '✅ Added cancelled_at column to orders';
    END IF;

    RAISE NOTICE '✅ Orders table updated';
END $$;

-- 2. Update marketplaces table - add multilang and type columns
DO $$
BEGIN
    -- Add name_uz column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplaces' AND column_name = 'name_uz'
    ) THEN
        ALTER TABLE marketplaces ADD COLUMN name_uz VARCHAR(255);
        -- Copy existing name to name_uz
        UPDATE marketplaces SET name_uz = name WHERE name_uz IS NULL AND name IS NOT NULL;
        RAISE NOTICE '✅ Added name_uz column to marketplaces';
    END IF;

    -- Add name_ru column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplaces' AND column_name = 'name_ru'
    ) THEN
        ALTER TABLE marketplaces ADD COLUMN name_ru VARCHAR(255);
        -- Copy existing name to name_ru
        UPDATE marketplaces SET name_ru = name WHERE name_ru IS NULL AND name IS NOT NULL;
        RAISE NOTICE '✅ Added name_ru column to marketplaces';
    END IF;

    -- Add name_en column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplaces' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE marketplaces ADD COLUMN name_en VARCHAR(255);
        -- Copy existing name to name_en
        UPDATE marketplaces SET name_en = name WHERE name_en IS NULL AND name IS NOT NULL;
        RAISE NOTICE '✅ Added name_en column to marketplaces';
    END IF;

    -- Add type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplaces' AND column_name = 'type'
    ) THEN
        ALTER TABLE marketplaces ADD COLUMN type VARCHAR(50);
        -- Set default type based on api_type
        UPDATE marketplaces SET type = COALESCE(api_type, 'manual') WHERE type IS NULL;
        RAISE NOTICE '✅ Added type column to marketplaces';
    END IF;

    RAISE NOTICE '✅ Marketplaces table updated';
END $$;

-- 3. Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration 010 completed: orders and marketplaces tables updated';
END $$;
