const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// Validate user and return user data or guest status
router.post('/validate', authenticate, async (req, res) => {
    try {
        // User is authenticated via middleware, and telegramUser is on req.
        // Now, check if this user exists in our database.
        const { id: telegram_id } = req.telegramUser;
        const userResult = await pool.query('SELECT id, first_name, last_name, phone_number, telegram_username FROM users WHERE telegram_id = $1', [telegram_id]);

        if (userResult.rows.length > 0) {
            // User exists, send back their data
            res.json({ status: 'existing_user', user: userResult.rows[0] });
        } else {
            // User does not exist in our DB, they are a "guest"
            // The frontend can use the telegramUser data to pre-fill fields if desired
            res.json({ status: 'guest', telegramUser: req.telegramUser });
        }
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
    if (!req.userId) {
        // This handles guests trying to access a profile that doesn't exist yet.
        return res.status(404).json({ error: 'User profile not found. Please create a profile.' });
    }
    try {
        const user = await pool.query('SELECT first_name, last_name, phone_number, telegram_username FROM users WHERE id = $1', [req.userId]);
        if (user.rows.length > 0) {
            res.json(user.rows[0]);
        } else {
            // This case should not be hit if req.userId is correctly set for existing users.
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create or update user profile
router.put('/profile', authenticate, async (req, res) => {
    const { first_name, last_name, phone_number } = req.body;
    const { id: telegram_id, username: telegram_username } = req.telegramUser;

    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }

    try {
        // Use req.userId if it exists (user is being updated)
        // If it doesn't exist, it's a new user being created from a guest.
        if (req.userId) {
            // Update existing user
            const updatedUser = await pool.query(
                'UPDATE users SET first_name = $1, last_name = $2, phone_number = $3 WHERE id = $4 RETURNING id, first_name, last_name, phone_number, telegram_username',
                [first_name, last_name, phone_number, req.userId]
            );
            res.json(updatedUser.rows[0]);
        } else {
            // Create new user
            const newUser = await pool.query(
                'INSERT INTO users (telegram_id, first_name, last_name, phone_number, telegram_username) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, phone_number, telegram_username',
                [telegram_id, first_name, last_name, phone_number, telegram_username || null]
            );
            res.status(201).json(newUser.rows[0]);
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'This user already exists.' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;