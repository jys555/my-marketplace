-- ============================================
-- FIX AMAZING STORE PRICES - marketplace_id NULL dan ID ga o'zgartirish
-- ============================================
-- Bu migration mavjud product_prices yozuvlarini yangilaydi
-- marketplace_id = NULL bo'lgan yozuvlarni Amazing Store marketplace ID'siga o'zgartiradi
-- Migration version: 004

DO $$
DECLARE
    amazing_store_id INTEGER;
    updated_count INTEGER;
BEGIN
    -- Amazing Store marketplace ID'sini olish
    SELECT id INTO amazing_store_id
    FROM marketplaces
    WHERE name = 'AMAZING_STORE'
    LIMIT 1;

    -- Agar Amazing Store marketplace topilmasa, yaratish
    IF amazing_store_id IS NULL THEN
        INSERT INTO marketplaces (name, api_type, marketplace_code, is_active)
        VALUES ('AMAZING_STORE', 'amazing_store', '202049831', true)
        RETURNING id INTO amazing_store_id;
        RAISE NOTICE 'Created AMAZING_STORE marketplace with ID: %', amazing_store_id;
    ELSE
        RAISE NOTICE 'Found AMAZING_STORE marketplace with ID: %', amazing_store_id;
    END IF;

    -- marketplace_id = NULL bo'lgan yozuvlarni yangilash
    UPDATE product_prices
    SET marketplace_id = amazing_store_id
    WHERE marketplace_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % product_prices records with AMAZING_STORE marketplace_id', updated_count;
END $$;

