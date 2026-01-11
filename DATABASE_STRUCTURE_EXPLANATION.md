# Database Structure - 21 ta Table Tushuntiruvi

## PostgreSQL'da 21 ta table mavjud va bu TO'G'RI!

### Core Amazing Store Tables (14 ta) - `000_RESET_DATABASE.sql`
1. **users** - Foydalanuvchilar (telegram_id, first_name, phone, etc.)
2. **marketplaces** - Do'konlar (AMAZING_STORE, UZUM, ASAXIY, etc.)
3. **categories** - Kategoriyalar (name_uz, name_ru, icon, color)
4. **products** - Tovarlar (SKU, name_uz/ru, price, sale_price, image_url)
5. **banners** - Reklama bannerlar (title_uz/ru, image_url, link_type)
6. **favorites** - Sevimlilar (user_id + product_id)
7. **cart_items** - Savatcha (user_id + product_id + quantity + price_snapshot)
8. **orders** - Zakazlar (customer_name, phone, total, status)
9. **order_items** - Zakaz detallari (order_id + product_id + quantity + price)
10. **marketplace_products** - Marketplace'lardagi tovarlar (product_id + marketplace_id + external_id)
11. **inventory** - Ombor stoki (product_id + quantity)
12. **inventory_movements** - Stok o'zgarishlari (product_id + quantity + movement_type)
13. **marketplace_webhooks** - Webhook sozlamalari
14. **sync_logs** - Marketplace sinxronizatsiya loglar

### Seller App Extension Tables (5 ta) - `002_seller_app_extensions.sql`
15. **purchases** - Nakladnoylar (supplier_name, total_amount)
16. **purchase_items** - Nakladnoy detallari (purchase_id + product_id + purchase_price)
17. **product_prices** - Marketplace'larga narxlar (product_id + marketplace_id + cost_price + selling_price + profitability)
18. **daily_analytics** - Kunlik analytics (date + marketplace_id + revenue + profit)
19. **product_analytics** - Tovar analytics (product_id + date + orders_count + revenue)

### Migration Tracking (1 ta) - Avtomatik yaratiladi
20. **schema_migrations** - Migration tracking (version + applied_at)

### Price History (1 ta) - `000_RESET_DATABASE.sql`'da
21. **price_history** - Narx o'zgarishlari tarixi (product_id + old_price + new_price + changed_at)

---

## JAMI: 21 ta table ✅

Bu professional, event-driven, scalable database architecture. Barcha tablelar bir-biri bilan to'g'ri bog'langan va foreign key constraintlari mavjud.

### Asosiy printsiplar:
- ✅ **Unified Stock Management** - Inventory table bitta
- ✅ **Event-driven** - Inventory movements tracking
- ✅ **Marketplace Integration** - marketplace_products, marketplace_webhooks
- ✅ **Seller App Analytics** - daily_analytics, product_analytics
- ✅ **Price Management** - product_prices (per marketplace), price_history

Hammasi to'g'ri! 🎉
