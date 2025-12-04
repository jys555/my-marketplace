const { Bot, InlineKeyboard } = require('grammy');
const pool = require('../db');

class TelegramBotService {
    constructor() {
        this.bot = null;
        this.adminId = process.env.ADMIN_TELEGRAM_ID;
        this.amazingStoreUrl = process.env.AMAZING_STORE_URL || 'https://amazing-store-frontend.vercel.app';
        this.sellerAppUrl = process.env.SELLER_APP_URL || 'https://seller-app-frontend.vercel.app';
    }

    async initialize() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            console.warn('⚠️  TELEGRAM_BOT_TOKEN not set, bot disabled');
            return;
        }

        this.bot = new Bot(token);
        
        // Bot'ni initialize qilish (bot ma'lumotlarini Telegram API'dan olish)
        try {
            await this.bot.init();
            console.log('✅ Bot initialized');
        } catch (error) {
            console.error('❌ Bot initialization failed:', error);
            this.bot = null;
            return;
        }
        
        this.setupCommands();
        this.setupHandlers();
        
        // Webhook yoki polling
        if (process.env.WEBHOOK_URL) {
            await this.bot.api.setWebhook(process.env.WEBHOOK_URL);
            console.log('✅ Bot webhook set:', process.env.WEBHOOK_URL);
        } else {
            // bot.start() Promise qaytaradi va hech qachon resolve qilmaydi (polling loop)
            // Shuning uchun await qilmaymiz, background'da ishlaydi
            this.bot.start().catch((error) => {
                console.error('❌ Bot polling error:', error);
            });
            console.log('✅ Bot started with polling');
        }
    }

    setupCommands() {
        // /start - Barcha foydalanuvchilar uchun
        this.bot.command('start', async (ctx) => {
            const telegramId = ctx.from.id;
            const isAdmin = await this.checkIsAdmin(telegramId);
            
            const keyboard = new InlineKeyboard();
            
            // Amazing Store Mini App button (barcha uchun)
            keyboard.webApp('🛒 Amazing Store', this.amazingStoreUrl).row();
            
            // Seller App button (faqat admin uchun)
            if (isAdmin) {
                keyboard.webApp('📊 Seller App', this.sellerAppUrl).row();
            }
            
            await ctx.reply(
                `👋 Xush kelibsiz! Amazing Store botiga.\n\n` +
                `Bu bot orqali:\n` +
                `• 🛒 Mahsulotlar katalogini ko'rishingiz mumkin\n` +
                `• 📦 Buyurtmalar berishingiz mumkin\n` +
                `${isAdmin ? '• 📊 Seller App ga kirishingiz mumkin\n' : ''}` +
                `\nQuyidagi tugmalardan birini tanlang:`,
                { reply_markup: keyboard }
            );
        });

        // /orders - Mijozning buyurtmalari
        this.bot.command('orders', async (ctx) => {
            const telegramId = ctx.from.id;
            
            try {
                const { rows: userRows } = await pool.query(
                    'SELECT id FROM users WHERE telegram_id = $1',
                    [telegramId]
                );
                
                if (userRows.length === 0) {
                    return ctx.reply('❌ Siz hali ro\'yxatdan o\'tmadingiz. Avval Amazing Store\'ga kiring.');
                }
                
                const userId = userRows[0].id;
                const { rows: orders } = await pool.query(`
                    SELECT 
                        o.id, o.order_number, o.status, o.total_amount, o.created_at,
                        COUNT(oi.id) as items_count
                    FROM orders o
                    LEFT JOIN order_items oi ON o.id = oi.order_id
                    WHERE o.user_id = $1
                    GROUP BY o.id
                    ORDER BY o.created_at DESC
                    LIMIT 10
                `, [userId]);
                
                if (orders.length === 0) {
                    return ctx.reply('📭 Sizda hali buyurtmalar yo\'q.');
                }
                
                let message = '📦 Sizning buyurtmalaringiz:\n\n';
                orders.forEach((order, index) => {
                    const statusEmoji = {
                        'new': '🆕',
                        'processing': '🔄',
                        'ready': '📦',
                        'delivered': '✅',
                        'cancelled': '❌'
                    }[order.status] || '📋';
                    
                    message += `${index + 1}. ${statusEmoji} ${order.order_number}\n`;
                    message += `   Summa: ${order.total_amount} so'm\n`;
                    message += `   Status: ${order.status}\n`;
                    message += `   Sana: ${new Date(order.created_at).toLocaleDateString('uz-UZ')}\n\n`;
                });
                
                const keyboard = new InlineKeyboard();
                keyboard.webApp('🛒 Yangi buyurtma', this.amazingStoreUrl);
                
                await ctx.reply(message, { reply_markup: keyboard });
            } catch (error) {
                console.error('Error fetching orders:', error);
                await ctx.reply('❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
            }
        });

        // /admin - Seller App (faqat admin uchun)
        this.bot.command('admin', async (ctx) => {
            const telegramId = ctx.from.id;
            const isAdmin = await this.checkIsAdmin(telegramId);
            
            if (!isAdmin) {
                return ctx.reply('❌ Sizda admin huquqi yo\'q.');
            }
            
            const keyboard = new InlineKeyboard();
            keyboard.webApp('📊 Seller App', this.sellerAppUrl).row();
            keyboard.webApp('🛒 Amazing Store', this.amazingStoreUrl);
            
            await ctx.reply(
                `📊 Seller App\n\n` +
                `Quyidagi tugmalardan birini tanlang:`,
                { reply_markup: keyboard }
            );
        });
    }

    setupHandlers() {
        // Barcha xabarlar uchun menu button'ni yangilash
        this.bot.on('message', async (ctx) => {
            // Agar foydalanuvchi /start yoki /orders yoki /admin yozgan bo'lsa, 
            // bu yerda hech narsa qilmaymiz (command handler'lar ishlaydi)
            if (ctx.message.text && ctx.message.text.startsWith('/')) {
                return;
            }
            
            // Boshqa xabarlar uchun menu button'ni ko'rsatish
            const telegramId = ctx.from.id;
            const isAdmin = await this.checkIsAdmin(telegramId);
            
            const keyboard = new InlineKeyboard();
            keyboard.webApp('🛒 Amazing Store', this.amazingStoreUrl).row();
            
            if (isAdmin) {
                keyboard.webApp('📊 Seller App', this.sellerAppUrl).row();
            }
            
            await ctx.reply(
                'Quyidagi tugmalardan birini tanlang:',
                { reply_markup: keyboard }
            );
        });
    }

    // Database'dan is_admin field'ni tekshirish
    async checkIsAdmin(telegramId) {
        try {
            const { rows } = await pool.query(
                'SELECT is_admin FROM users WHERE telegram_id = $1',
                [telegramId]
            );
            
            if (rows.length === 0) {
                return false;
            }
            
            return rows[0].is_admin === true;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    // Admin'ga yangi buyurtma xabari
    async notifyAdminNewOrder(order) {
        if (!this.bot) return;
        
        // Barcha admin'larni topish
        const { rows: admins } = await pool.query(
            'SELECT telegram_id FROM users WHERE is_admin = true'
        );
        
        if (admins.length === 0) {
            console.warn('⚠️  No admins found in database');
            return;
        }
        
        const message = `🆕 Yangi buyurtma!\n\n` +
            `📦 Buyurtma raqami: ${order.order_number}\n` +
            `💰 Summa: ${order.total_amount} so'm\n` +
            `👤 Mijoz: ${order.user_name}\n` +
            `📞 Telefon: ${order.user_phone || 'N/A'}\n` +
            `📅 Sana: ${new Date().toLocaleString('uz-UZ')}`;
        
        // Barcha admin'larga xabar yuborish
        for (const admin of admins) {
            try {
                await this.bot.api.sendMessage(admin.telegram_id, message);
            } catch (error) {
                console.error(`Error sending message to admin ${admin.telegram_id}:`, error);
            }
        }
    }

    // Mijozga buyurtma statusi xabari
    async notifyCustomerOrderStatus(order, telegramId) {
        if (!this.bot || !telegramId) return;
        
        const statusMessages = {
            'new': '✅ Buyurtmangiz qabul qilindi',
            'processing': '🔄 Buyurtmangiz tayyorlanmoqda',
            'ready': '📦 Buyurtmangiz tayyor',
            'delivered': '🚚 Buyurtmangiz yetkazib berildi',
            'cancelled': '❌ Buyurtmangiz bekor qilindi'
        };
        
        const message = `${statusMessages[order.status] || '📋'}\n\n` +
            `📦 Buyurtma raqami: ${order.order_number}\n` +
            `💰 Summa: ${order.total_amount} so'm\n` +
            `📅 Sana: ${new Date().toLocaleString('uz-UZ')}`;
        
        try {
            await this.bot.api.sendMessage(telegramId, message);
        } catch (error) {
            console.error(`Error sending message to customer ${telegramId}:`, error);
        }
    }
}

module.exports = new TelegramBotService();

