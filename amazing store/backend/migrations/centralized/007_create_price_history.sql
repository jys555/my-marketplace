-- ============================================
-- CREATE PRICE_HISTORY TABLE
-- ============================================
-- Migration version: 007
-- Bu migration price history tracking uchun table yaratadi
-- Best practice: Price changes tracking for analytics

-- Price history table (for analytics and price tracking)
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Price information
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
    
    -- Validity period
    effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP, -- NULL = current price
    
    -- Audit trail
    created_by INTEGER REFERENCES users(id), -- admin who changed price
    reason TEXT, -- reason for price change
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_effective_dates ON price_history(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_price_history_current ON price_history(product_id, effective_to) WHERE effective_to IS NULL;

-- Comments for documentation
COMMENT ON TABLE price_history IS 'Historical price tracking for products';
COMMENT ON COLUMN price_history.effective_from IS 'When this price became effective';
COMMENT ON COLUMN price_history.effective_to IS 'When this price expired (NULL = current)';
COMMENT ON COLUMN price_history.created_by IS 'Admin who changed the price';
COMMENT ON COLUMN price_history.reason IS 'Reason for price change (seasonal, promotion, etc)';

-- Function to automatically track price changes
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Agar price yoki sale_price o'zgarsa
    IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.sale_price IS DISTINCT FROM NEW.sale_price) THEN
        -- Eski price'ni close qilish
        UPDATE price_history
        SET effective_to = NOW()
        WHERE product_id = NEW.id AND effective_to IS NULL;
        
        -- Yangi price'ni qo'shish
        INSERT INTO price_history (product_id, price, sale_price, effective_from)
        VALUES (NEW.id, NEW.price, NEW.sale_price, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track price changes
DROP TRIGGER IF EXISTS track_product_price_changes ON products;
CREATE TRIGGER track_product_price_changes
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_price_change();

-- Seed initial price history from existing products
-- Faqat agar products table'da ma'lumotlar bo'lsa
DO $$
DECLARE
    product_record RECORD;
    count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Seeding initial price history...';
    
    -- Har bir active product uchun initial price history yaratish
    FOR product_record IN 
        SELECT id, price, sale_price, created_at
        FROM products
        WHERE price IS NOT NULL
    LOOP
        INSERT INTO price_history (
            product_id, 
            price, 
            sale_price, 
            effective_from,
            reason
        )
        VALUES (
            product_record.id,
            product_record.price,
            product_record.sale_price,
            product_record.created_at,
            'Initial price'
        )
        ON CONFLICT DO NOTHING;
        
        count := count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Seeded price history for % products', count;
END $$;

