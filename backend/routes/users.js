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
        const userResult = await pool.query('SELECT id, first_name, last_name, phone, username, cart, favorites FROM users WHERE telegram_id = $1', [telegram_id]);

        if (userResult.rows.length > 0) {
            // User exists, send back their data
            const user = userResult.rows[0];
            // Ensure cart and favorites are not null
            user.cart = user.cart || {};
            user.favorites = user.favorites || [];
            res.json({ status: 'existing_user', user: user });
        } else {
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
        const user = await pool.query('SELECT first_name, last_name, phone, username, cart, favorites FROM users WHERE id = $1', [req.userId]);
        if (user.rows.length > 0) {
            const userProfile = user.rows[0];
            // Ensure cart and favorites are not null
            userProfile.cart = userProfile.cart || {};
            userProfile.favorites = userProfile.favorites || [];
            res.json(userProfile);
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
    const { first_name, last_name, phone } = req.body;
    const { id: telegram_id, username } = req.telegramUser;

    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }

    try {
        // Use req.userId if it exists (user is being updated)
        // If it doesn't exist, it's a new user being created from a guest.
        if (req.userId) {
            // Update existing user
            const updatedUser = await pool.query(
                'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING id, first_name, last_name, phone, username, cart, favorites',
                [first_name, last_name, phone, req.userId]
            );
            const user = updatedUser.rows[0];
            user.cart = user.cart || {};
            user.favorites = user.favorites || [];
            res.json(user);
        } else {
            // Create new user
            const newUser = await pool.query(
                'INSERT INTO users (telegram_id, first_name, last_name, phone, username) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, phone, username, cart, favorites',
                [telegram_id, first_name, last_name, phone, username || null]
            );
            const user = newUser.rows[0];
            user.cart = user.cart || {};
            user.favorites = user.favorites || [];
            res.status(201).json(user);
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'This user already exists.' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// New route to update cart
router.put('/cart', authenticate, async (req, res) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    const { cart } = req.body;
    if (typeof cart !== 'object' || cart === null) {
        return res.status(400).json({ error: 'Invalid cart data' });
    }
    try {
        await pool.query('UPDATE users SET cart = $1 WHERE id = $2', [cart, req.userId]);
        res.status(200).json({ message: 'Cart updated successfully' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// New route to update favorites
router.put('/favorites', authenticate, async (req, res) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    const { favorites } = req.body;
    if (!Array.isArray(favorites)) {
        return res.status(400).json({ error: 'Invalid favorites data' });
    }
    try {
        await pool.query('UPDATE users SET favorites = $1 WHERE id = $2', [favorites, req.userId]);
        res.status(200).json({ message: 'Favorites updated successfully' });
    } catch (error) {
        console.error('Error updating favorites:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;