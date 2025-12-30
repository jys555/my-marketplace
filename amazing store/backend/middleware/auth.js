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

        if (!authDate || (now - authDate) > maxAge) {
            return res.status(403).json({ message: 'Authentication data expired' });
        }

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            return res.status(403).json({ message: 'Invalid data signature' });
        }

        const user = JSON.parse(params.get('user'));
        req.telegramUser = user;

        if (user && user.id) {
            const { rows: userRows } = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user.id]);
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

const isAdmin = (req, res, next) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) {
        logger.error('CRITICAL: ADMIN_TELEGRAM_ID is not configured on the server.');
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    if (!req.telegramUser || req.telegramUser.id.toString() !== adminId) {
        logger.warn(`Forbidden access attempt by Telegram ID: ${req.telegramUser ? req.telegramUser.id : 'Unknown'}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
};

module.exports = { authenticate, isAdmin };
