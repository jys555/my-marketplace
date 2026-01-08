-- ============================================
-- FIX FAVORITES COLUMN TYPE
-- ============================================
-- Migration version: 005
-- Bu migration favorites column'ini JSONB'dan INTEGER[] ga o'zgartiradi

-- Favorites column'ni to'g'rilash
-- Avval eski JSONB ma'lumotlarni saqlab qolish
DO $$
BEGIN
    -- Agar favorites column JSONB bo'lsa, INTEGER[] ga o'zgartirish
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'favorites' 
        AND data_type = 'jsonb'
    ) THEN
        -- Eski ma'lumotlarni backup qilish (optional)
        -- Keyin type'ni o'zgartirish
        ALTER TABLE users ALTER COLUMN favorites DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN favorites TYPE INTEGER[] USING '{}';
        ALTER TABLE users ALTER COLUMN favorites SET DEFAULT '{}';
        
        RAISE NOTICE 'Favorites column converted from JSONB to INTEGER[]';
    ELSE
        RAISE NOTICE 'Favorites column is already INTEGER[], skipping...';
    END IF;
END $$;

COMMENT ON COLUMN users.favorites IS 'Array of favorite product IDs (INTEGER[])';

