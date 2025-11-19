const crypto = require('crypto');

function authenticate(req, res, next) {
    const authHeader = req.headers['x-telegram-data'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication data not provided' });
    }

    // .env faylidagi o'zgaruvchi nomini to'g'rilaymiz
    const botToken = process.env.TELEGRAM_BOT_TOKEN; 
    if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN is not configured in environment variables.");
        return res.status(500).json({ message: 'Internal server configuration error' });
    }

    try {
        const params = new URLSearchParams(authHeader);
        const hash = params.get('hash');
        params.delete('hash');

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n'); // '\\n' emas, '\n' bo'lishi kerak

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            return res.status(403).json({ message: 'Invalid data signature' });
        }
        
        const user = JSON.parse(params.get('user'));
        req.telegramId = user.id;   // Eski kod bilan moslik uchun
        req.telegramUser = user; // Yangi isAdmin funksiyasi uchun

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(400).json({ message: 'Invalid authentication data format' });
    }
}

// YANGI FUNKSIYA: isAdmin
const isAdmin = (req, res, next) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (!adminId) {
        console.error('CRITICAL: ADMIN_TELEGRAM_ID is not configured on the server.');
        return res.status(500).json({ error: 'Admin ID not configured on server.' });
    }
    // req.telegramUser endi 'authenticate' middleware tomonidan yaratiladi
    if (!req.telegramUser || req.telegramUser.id.toString() !== adminId) {
        console.warn(`Forbidden access attempt by Telegram ID: ${req.telegramUser ? req.telegramUser.id : 'Unknown'}`);
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
};


module.exports = { authenticate, isAdmin }; // isAdmin'ni ham export qilamiz