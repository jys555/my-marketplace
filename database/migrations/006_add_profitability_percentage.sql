-- ============================================
-- PRODUCT_PRICES GA PROFITABILITY_PERCENTAGE QO'SHISH
-- ============================================
-- Bu migration product_prices jadvaliga profitability_percentage qo'shadi
-- va profitability ni foizda hisoblaydi
-- Migration version: 006

-- 1. profitability_percentage ustunini qo'shish
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='product_prices' AND column_name='profitability_percentage'
    ) THEN
        ALTER TABLE product_prices
        ADD COLUMN profitability_percentage DECIMAL(5, 2);
        RAISE NOTICE 'Added profitability_percentage column to product_prices';
    END IF;
END $$;

-- 2. Mavjud profitability dan profitability_percentage ni hisoblash
-- Formula: ((selling_price - cost_price - commission) / cost_price) * 100
DO $$
DECLARE
    price_record RECORD;
    calculated_percentage DECIMAL(5, 2);
BEGIN
    FOR price_record IN 
        SELECT 
            id, 
            product_id, 
            cost_price, 
            selling_price, 
            commission_rate,
            profitability
        FROM product_prices
        WHERE cost_price IS NOT NULL 
        AND cost_price > 0
        AND selling_price IS NOT NULL
    LOOP
        -- Komissiya miqdorini hisoblash
        DECLARE
            commission_amount DECIMAL(10, 2) := 0;
        BEGIN
            IF price_record.commission_rate IS NOT NULL THEN
                commission_amount := (price_record.selling_price * price_record.commission_rate) / 100;
            END IF;

            -- Rentabillik foizini hisoblash
            -- Formula: ((selling_price - cost_price - commission) / selling_price) * 100
            calculated_percentage := ((price_record.selling_price - price_record.cost_price - commission_amount) / price_record.selling_price) * 100;

            -- Database'ga yozish
            UPDATE product_prices
            SET profitability_percentage = calculated_percentage
            WHERE id = price_record.id;
        END;
    END LOOP;
    
    RAISE NOTICE 'Calculated profitability_percentage for existing records';
END $$;

-- 3. Trigger yaratish - profitability_percentage ni avtomatik hisoblash
CREATE OR REPLACE FUNCTION calculate_profitability_percentage()
RETURNS TRIGGER AS $$
DECLARE
    commission_amount DECIMAL(10, 2) := 0;
    calculated_percentage DECIMAL(5, 2);
BEGIN
    -- cost_price va selling_price mavjud bo'lsa, hisoblash
    IF NEW.cost_price IS NOT NULL 
       AND NEW.cost_price > 0 
       AND NEW.selling_price IS NOT NULL THEN
        
        -- Komissiya miqdorini hisoblash
        IF NEW.commission_rate IS NOT NULL THEN
            commission_amount := (NEW.selling_price * NEW.commission_rate) / 100;
        END IF;

        -- Rentabillik foizini hisoblash
        -- Formula: ((selling_price - cost_price - commission) / selling_price) * 100
        calculated_percentage := ((NEW.selling_price - NEW.cost_price - commission_amount) / NEW.selling_price) * 100;

        NEW.profitability_percentage := calculated_percentage;
    ELSE
        NEW.profitability_percentage := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ni qo'shish
DROP TRIGGER IF EXISTS trigger_calculate_profitability_percentage ON product_prices;
CREATE TRIGGER trigger_calculate_profitability_percentage
    BEFORE INSERT OR UPDATE ON product_prices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_profitability_percentage();

-- Index qo'shish (performance uchun)
CREATE INDEX IF NOT EXISTS idx_product_prices_profitability_percentage ON product_prices(profitability_percentage);

