// backend/routes/orders.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Unikal buyurtma raqamini yaratish funksiyasi
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `AMZ-${timestamp.slice(-6)}-${randomPart}`;
}

// O'ZGARTIRILDI: Foydalanuvchining barcha buyurtmalarini olish
// Marshrut endi shunchaki '/' va telegram_id `authenticate` middleware'dan olinadi
router.get('/', async (req, res) => {
    // telegram_id endi req.params'dan emas, req.telegramId'dan olinadi
    const telegram_id = req.telegramId; 

    // Har ehtimolga qarshi, agar authenticate middleware ishlamay qolsa
    if (!telegram_id) {
        return res.status(401).json({ error: 'Foydalanuvchi aniqlanmadi.' });
    }

    try {
        const result = await pool.query(
            `SELECT 
                o.id, o.order_number, o.status, o.total_amount, o.created_at,
                (SELECT json_agg(json_build_object('name', p.name_uz, 'image', p.image_url)) 
                   FROM order_items oi 
                   JOIN products p ON oi.product_id = p.id 
                  WHERE oi.order_id = o.id 
                  LIMIT 1) as first_item_details
             FROM orders o
             WHERE o.user_id = $1 
             ORDER BY o.created_at DESC`,
            [telegram_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Yangi buyurtma yaratish
router.post('/', async (req, res) => {
    const { user_id, user_info, items, payment_method, delivery_method } = req.body;

    if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ error: "Kerakli ma'lumotlar to'liq emas." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Mahsulotlar narxini bazadan olish va umumiy summani hisoblash
        const productIds = items.map(item => item.product_id);
        const productsResult = await client.query(
            'SELECT id, price, sale_price FROM products WHERE id = ANY($1::int[])',
            [productIds]
        );

        let totalAmount = 0;
        const productPrices = {};
        productsResult.rows.forEach(p => {
            productPrices[p.id] = parseFloat(p.sale_price || p.price);
        });

        for (const item of items) {
            if (!productPrices[item.product_id]) {
                throw new Error(`Mahsulot (id: ${item.product_id}) topilmadi yoki narxi yo'q.`);
            }
            totalAmount += productPrices[item.product_id] * item.quantity;
        }

        // 2. `orders` jadvaliga yozish
        const orderNumber = generateOrderNumber();
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, order_number, total_amount, payment_method, delivery_method)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, order_number, created_at`,
            [user_id, orderNumber, totalAmount, payment_method, delivery_method]
        );
        const newOrder = orderResult.rows[0];

        // 3. `order_items` jadvaliga yozish
        const itemQueries = items.map(item => {
            const price = productPrices[item.product_id];
            return client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [newOrder.id, item.product_id, item.quantity, price]
            );
        });
        await Promise.all(itemQueries);

        await client.query('COMMIT');

        // --- Xabarnoma yuborish (Yagona to'g'ri usul) ---
        try {
            // XATO TUZATILDI: 'bot' obyekti 'require' orqali emas, 'req' (so'rov) orqali olinadi.
            const bot = req.bot; 

            const adminChatIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim()).filter(id => id);
            const userFullName = `${user_info.first_name || ''} ${user_info.last_name || ''}`.trim();
            const userLink = user_info.username ? `(@${user_info.username})` : `(ID: ${user_id})`;

            // Adminga xabar
            const adminMessage = `
📢 **Yangi buyurtma!**

**Order Number:** \`${newOrder.order_number}\`
**Mijoz:** ${userFullName} ${userLink}
**Summa:** ${totalAmount.toLocaleString('uz-UZ')} so'm
**To'lov turi:** ${payment_method}
**Yetkazib berish:** ${delivery_method}
            `;
            
            for (const adminId of adminChatIds) {
                // XATO TUZATILDI: 'sendMessage' o'rniga 'bot.sendMessage' ishlatiladi
                await bot.sendMessage(adminId, adminMessage, { parse_mode: 'Markdown' });
            }

            // Foydalanuvchiga xabar
            const userMessage = `
✅ **Buyurtmangiz qabul qilindi!**

Rahmat, ${user_info.first_name || 'hurmatli mijoz'}!

Sizning **${newOrder.order_number}** raqamli buyurtmangiz muvaffaqiyatli qabul qilindi va tez orada yig'ishni boshlaymiz.

Buyurtma holatini profil sahifasidagi "Buyurtmalarim" bo'limidan kuzatib borishingiz mumkin.
            `;
            // XATO TUZATILDI: 'sendMessage' o'rniga 'bot.sendMessage' ishlatiladi
            await bot.sendMessage(user_id, userMessage, { parse_mode: 'Markdown' });

        } catch (notificationError) {
            console.error("Xabarnoma yuborishda xatolik:", notificationError);
        }
        
        res.status(201).json(newOrder);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Buyurtma yaratishda xatolik yuz berdi.' });
    } finally {
        client.release();
    }
});

module.exports = router;