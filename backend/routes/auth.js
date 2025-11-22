const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/validate - Validate user token and return user data
router.post('/validate', authenticate, async (req, res) => {
    try {
        // The user is authenticated by the middleware, we just need to fetch their data
        const { rows } = await db.query('SELECT id, telegram_id, username, first_name, last_name, phone, language_code, is_admin FROM users WHERE telegram_id = $1', [req.telegramUser.id]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            // This case should ideally not happen if authenticate middleware is used correctly
            res.status(404).json({ error: 'User not found in database despite valid Telegram data.' });
        }
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;