const crypto = require('crypto');
const pool = require('../db');

// Telegram autentifikatsiya middleware
async function authenticate(req, res, next) {
    const authHeader = req.headers['x-telegram-data'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication data not provided' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN is not configured in environment variables.");
        return res.status(500).json({ message: 'Internal server configuration error' });
    }

    try {
        const params = new URLSearchParams(authHeader);
        const hash = params.get('hash');
        params.delete('hash');

        // auth_date tekshiruvi - 24 soatdan eski ma'lumotlarni rad etish
        const authDate = parseInt(params.get('auth_date'));
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 86400; // 24 soat
        
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

        // Foydalanuvchining ichki ID'sini va admin statusini topish
        if (user && user.id) {
            const { rows: userRows } = await pool.query(
                'SELECT id, is_admin FROM users WHERE telegram_id = $1',
                [user.id]
            );
            if (userRows.length > 0) {
                req.userId = userRows[0].id;
                req.isAdmin = userRows[0].is_admin === true;
            }
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(400).json({ message: 'Invalid authentication data format' });
    }
}

// Admin tekshiruvi - faqat is_admin = true bo'lgan userlar
const isAdmin = async (req, res, next) => {
    if (!req.telegramUser) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.isAdmin) {
        console.warn(`Forbidden access attempt by Telegram ID: ${req.telegramUser.id}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
};

module.exports = { authenticate, isAdmin };

