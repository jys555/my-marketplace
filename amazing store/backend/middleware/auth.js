const crypto = require('crypto');
const pool = require('../db'); // Ma'lumotlar bazasini import qilish

async function authenticate(req, res, next) { // Funksiyani asinxron qilish
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

        // auth_date tekshiruvi - 24 soatdan eski ma'lumotlarni rad etish (replay attack oldini olish)
        const authDate = parseInt(params.get('auth_date'));
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 86400; // 24 soat (sekundlarda)
        
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

        // Foydalanuvchining ichki ID'sini topish
        if (user && user.id) {
            const { rows: userRows } = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user.id]);
            if (userRows.length > 0) {
                req.userId = userRows[0].id; // Ichki DB user ID'sini so'rovga qo'shish
            }
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(400).json({ message: 'Invalid authentication data format' });
    }
}

const isAdmin = (req, res, next) => {
    // Bu funksiya o'zgarishsiz qoladi
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) {
        console.error('CRITICAL: ADMIN_TELEGRAM_ID is not configured on the server.');
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    if (!req.telegramUser || req.telegramUser.id.toString() !== adminId) {
        console.warn(`Forbidden access attempt by Telegram ID: ${req.telegramUser ? req.telegramUser.id : 'Unknown'}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
};

module.exports = { authenticate, isAdmin };