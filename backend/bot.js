// backend/bot.js
const TelegramBot = require('node-telegram-bot-api');

// Muhit o'zgaruvchilarini o'qish
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot;

if (token) {
  bot = new TelegramBot(token);
  console.log('✅ Telegram bot muvaffaqiyatli ishga tushirildi.');
  
  // Webhookni o'chirish (polling rejimida ishlash uchun)
  bot.deleteWebHook().then(() => {
    console.log('Webhook o\'chirildi. Bot polling rejimida ishlaydi.');
    bot.startPolling();
  });

} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN topilmadi. Telegram xabarnomalari ishlamaydi.');
}

/**
 * Asinxron ravishda Telegram xabarini yuborish.
 * @param {number|string} chatId - Xabar yuboriladigan chat ID.
 * @param {string} text - Yuboriladigan xabar matni.
 * @param {object} [options] - Qo'shimcha parametrlar (masalan, parse_mode).
 */
const sendMessage = async (chatId, text, options = {}) => {
  if (!bot) {
    console.error('Bot ishga tushirilmagan. Xabar yuborib bo\'lmadi.');
    return;
  }
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (error) {
    console.error(`Xabar yuborishda xatolik (chatId: ${chatId}):`, error.response ? error.response.body : error.message);
  }
};

module.exports = {
  sendMessage,
  bot // Agar bot obyektiga to'g'ridan-to'g'ri murojaat kerak bo'lsa
};