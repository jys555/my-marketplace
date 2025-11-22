const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/validate - Validate user and return user data or guest status
router.post('/validate', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, telegram_id, username, first_name, last_name, phone, language_code, is_admin FROM users WHERE telegram_id = $1', [req.telegramUser.id]);
        
        if (rows.length > 0) {
            // User found in DB, return full user profile
            res.status(200).json({ ...rows[0], is_guest: false });
        } else {
            // User not found in DB, return guest profile based on Telegram data
            const guestUser = {
                telegram_id: req.telegramUser.id,
                username: req.telegramUser.username,
                first_name: req.telegramUser.first_name,
                last_name: req.telegramUser.last_name,
                language_code: req.telegramUser.language_code,
                is_guest: true
            };
            res.status(200).json(guestUser);
        }
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;