const crypto = require('crypto');
const pool = require('../db');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
    const authHeader = req.headers['x-telegram-data'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication data not provided' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        logger.error('TELEGRAM_BOT_TOKEN is not configured in environment variables.');
        return res.status(500).json({ message: 'Internal server configuration error' });
    }

    try {
        const params = new URLSearchParams(authHeader);
        const hash = params.get('hash');
        params.delete('hash');

        const authDate = parseInt(params.get('auth_date'));
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 86400;

        if (!authDate || now - authDate > maxAge) {
            return res.status(403).json({ message: 'Authentication data expired' });
        }

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (calculatedHash !== hash) {
            return res.status(403).json({ message: 'Invalid data signature' });
        }

        const user = JSON.parse(params.get('user'));
        req.telegramUser = user;

        if (user && user.id) {
            const { rows: userRows } = await pool.query(
                'SELECT id FROM users WHERE telegram_id = $1',
                [user.id]
            );
            if (userRows.length > 0) {
                req.userId = userRows[0].id;
            }
        }

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(400).json({ message: 'Invalid authentication data format' });
    }
}

/**
 * Admin tekshiruv middleware
 * Avval database'dan is_admin field'ni tekshiradi
 * Agar database'da topilmasa, ADMIN_TELEGRAM_ID environment variable'dan foydalanadi (fallback)
 */
const isAdmin = async (req, res, next) => {
    if (!req.telegramUser || !req.telegramUser.id) {
        logger.warn('Forbidden access attempt: No Telegram user data');
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    const telegramId = req.telegramUser.id;

    try {
        // 1. Database'dan is_admin field'ni tekshirish (asosiy usul)
        const { rows } = await pool.query('SELECT is_admin FROM users WHERE telegram_id = $1', [
            telegramId,
        ]);

        if (rows.length > 0 && rows[0].is_admin === true) {
            // Database'da admin sifatida topildi
            return next();
        }

        // 2. Fallback: ADMIN_TELEGRAM_ID environment variable'dan tekshirish
        const adminId = process.env.ADMIN_TELEGRAM_ID;
        if (adminId && telegramId.toString() === adminId) {
            // Environment variable orqali admin
            return next();
        }

        // Admin emas
        logger.warn(`Forbidden access attempt by Telegram ID: ${telegramId}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    } catch (error) {
        logger.error('Error checking admin status:', error);
        // Xatolik bo'lsa, fallback sifatida environment variable'dan tekshirish
        const adminId = process.env.ADMIN_TELEGRAM_ID;
        if (adminId && telegramId.toString() === adminId) {
            return next();
        }
        return res.status(500).json({ error: 'Error checking admin status.' });
    }
};

module.exports = { authenticate, isAdmin };
