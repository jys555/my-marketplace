const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

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
        logger.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile. User must be registered.
 *     tags: [Users]
 *     security:
 *       - TelegramAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 username:
 *                   type: string
 *                 cart:
 *                   type: object
 *                   description: User shopping cart
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: User favorite product IDs
 *       404:
 *         description: User profile not found (user not registered)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
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
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Create or update user profile
 *     description: Create a new user profile or update existing one. Phone number must be in format +998XXXXXXXXX and belong to a valid Uzbek operator.
 *     tags: [Users]
 *     security:
 *       - TelegramAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - phone
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: User first name (required)
 *               last_name:
 *                 type: string
 *                 description: User last name
 *               phone:
 *                 type: string
 *                 pattern: '^\+998[0-9]{9}$'
 *                 description: Phone number in format +998XXXXXXXXX (required, must be valid Uzbek operator)
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       201:
 *         description: User profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error (invalid phone format, missing required fields, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create or update user profile
router.put('/profile', authenticate, async (req, res) => {
    const { first_name, last_name, phone } = req.body;
    const { id: telegram_id, username } = req.telegramUser;

    // Validatsiya - ism
    if (!first_name || !first_name.trim()) {
        return res.status(400).json({ error: 'Ism kiritish majburiy' });
    }

    // Validatsiya - telefon formati (+998XXXXXXXXX)
    if (!phone || !phone.match(/^\+998[0-9]{9}$/)) {
        return res.status(400).json({ error: 'Telefon raqam formati noto\'g\'ri. Namuna: +998901234567' });
    }

    // Validatsiya - O'zbekiston operatorlari
    const operatorCode = phone.slice(4, 6);
    const validOperators = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '71', '77'];
    if (!validOperators.includes(operatorCode)) {
        return res.status(400).json({ error: 'Noto\'g\'ri O\'zbekiston telefon raqami' });
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
        logger.error('Error saving user profile:', error);
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
        logger.error('Error updating cart:', error);
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
        logger.error('Error updating favorites:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin tekshirish endpointi
router.get('/check-admin', authenticate, isAdmin, (req, res) => {
    // Agar bu yerga yetib kelsa, demak foydalanuvchi admin
    res.status(200).json({ is_admin: true });
});

module.exports = router;