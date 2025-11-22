const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/users - Register a new user or update existing on login
// This single endpoint handles user creation.
router.post('/', authenticate, async (req, res) => {
    const { first_name, last_name, phone } = req.body;
    const { id: telegram_id, username } = req.telegramUser;

    if (!first_name || !phone) {
// ... existing code ...
    }

    try {
        // ON CONFLICT bilan bitta so'rovda ham yaratish, ham yangilash
        const { rows } = await pool.query(
            `INSERT INTO users (telegram_id, username, first_name, last_name, phone) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (telegram_id) 
             DO UPDATE SET 
                first_name = EXCLUDED.first_name, 
                last_name = EXCLUDED.last_name, 
                phone = EXCLUDED.phone,
                updated_at = NOW()
             RETURNING id, telegram_id, username, first_name, last_name, phone, is_admin`,
            [telegram_id, username, first_name, last_name, phone]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating or updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/users/profile - Update authenticated user's profile
// Marshrut o'zgartirildi, endi ID kerak emas.
router.put('/profile', authenticate, async (req, res) => {
    const { id: telegram_id } = req.telegramUser;
    const { first_name, last_name, phone } = req.body;

    if (!first_name || !phone) {
        return res.status(400).json({ error: 'First name and phone are required' });
    }

    try {
         const { rows } = await pool.query(
            `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() 
             WHERE telegram_id = $4 
             RETURNING id, telegram_id, username, first_name, last_name, phone, is_admin`,
            [first_name, last_name, phone, telegram_id]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;