-- ============================================
-- REMOVE MARKETPLACE INTEGRATIONS
-- ============================================
-- Migration version: 012
-- Bu migration barcha marketplace integratsiyaga tegishli tablelarni olib tashlaydi
-- Seller App endi faqat Amazing Store uchun boshqaruv va analiz paneli

-- 1. product_marketplace_integrations table'ni o'chirish
DROP TABLE IF EXISTS product_marketplace_integrations CASCADE;

-- 2. Eski marketplace tablelari (agar hali mavjud bo'lsa)
DROP TABLE IF EXISTS marketplace_products CASCADE;
DROP TABLE IF EXISTS marketplaces CASCADE;

-- Migration muvaffaqiyatli yakunlandi
-- Endi Seller App faqat Amazing Store uchun ishlaydi
