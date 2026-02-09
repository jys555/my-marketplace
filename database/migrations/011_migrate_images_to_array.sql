-- ============================================
-- MIGRATE IMAGES TO ARRAY
-- ============================================
-- Bu migration products jadvalidagi image_url field'ni images array'ga ko'chiradi
-- Migration version: 011

-- 1. images field qo'shish
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- 2. Eski image_url larni images array'ga ko'chirish
UPDATE products 
SET images = jsonb_build_array(
    jsonb_build_object(
        'url', image_url, 
        'has_white_background', false
    )
)
WHERE (images IS NULL OR images = '[]'::jsonb) 
  AND image_url IS NOT NULL
  AND image_url != '';

-- 3. image_url field'ni olib tashlash
ALTER TABLE products DROP COLUMN IF EXISTS image_url;
