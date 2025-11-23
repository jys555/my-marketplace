const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/users/validate - Validate user on app load
// Bu yangi endpoint ilova ochilganda chaqiriladi.
router.post('/validate', authenticate, async (req, res) => {
    if (!req.telegramUser || !req.telegramUser.id) {
        return res.status(401).json({ error: 'Invalid Telegram user data' });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [req.telegramUser.id]);
        
        if (rows.length > 0) {
            // Foydalanuvchi mavjud, uning ma'lumotlarini qaytaramiz
            res.json({ status: 'existing_user', user: rows[0] });
        } else {
            // Foydalanuvchi mavjud emas, "guest" sifatida qaytaramiz
            // Telegramdan olingan ma'lumotlarni vaqtincha qaytaramiz
            res.json({ 
                status: 'guest', 
                user: {
                    telegram_id: req.telegramUser.id,
                    first_name: req.telegramUser.first_name,
                    last_name: req.telegramUser.last_name,
                    username: req.telegramUser.username,
                    is_admin: false // Guestlar admin bo'la olmaydi
                } 
            });
        }
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// PUT /api/users/profile - Create or Update user profile
// Bu endpoint endi ham yaratish, ham yangilash uchun ishlaydi (UPSERT)
router.put('/profile', authenticate, async (req, res) => {
    if (!req.telegramUser || !req.telegramUser.id) {
        return res.status(401).json({ error: 'Invalid Telegram user data' });
    }

    const { first_name, last_name, phone } = req.body;
    const { id: telegram_id, username } = req.telegramUser;

    if (!first_name || !phone) {
        return res.status(400).json({ error: 'First name and phone are required' });
    }

    try {
        // ON CONFLICT (UPSERT) yordamida bitta so'rovda yaratish yoki yangilash
        const { rows } = await pool.query(
            `INSERT INTO users (telegram_id, username, first_name, last_name, phone, created_at, is_admin) 
             VALUES ($1, $2, $3, $4, $5, NOW(), false) 
             ON CONFLICT (telegram_id) 
             DO UPDATE SET 
                first_name = EXCLUDED.first_name, 
                last_name = EXCLUDED.last_name, 
                phone = EXCLUDED.phone
             RETURNING *`,
            [telegram_id, username, first_name, last_name, phone]
        );
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error creating/updating user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;