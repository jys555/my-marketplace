-- ============================================
-- 012_ensure_products_images_column.sql
-- Safely ensure products.images exists in production
-- Bu migration prod DB'da images kolonkasi yo'q bo'lib qolgan holatni tuzatadi
-- ============================================

-- 1. images column mavjud bo'lmasa, qo'shamiz
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- 2. Agar hali ham eski image_url ma'lumotlari bo'lsa, ulardan images array yasab qo'yamiz
UPDATE products
SET images = jsonb_build_array(
        jsonb_build_object(
            'url',
            image_url,
            'has_white_background',
            false
        )
    )
WHERE (images IS NULL OR images = '[]'::jsonb)
  AND image_url IS NOT NULL
  AND image_url <> '';

-- 3. Eski image_url ustunini xavfsiz tarzda olib tashlash (agar bo'lsa)
ALTER TABLE products
DROP COLUMN IF EXISTS image_url;

