const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Validate user and return user data or guest status
router.post('/validate', authenticate, async (req, res, next) => {
    try {
        // User is authenticated via middleware, and telegramUser is on req.
        // Now, check if this user exists in our database.
        const { id: telegram_id } = req.telegramUser;
        const userResult = await pool.query(
            'SELECT id, first_name, last_name, phone, username FROM users WHERE telegram_id = $1',
            [telegram_id]
        );

        if (userResult.rows.length > 0) {
            // User exists, send back their data
            const user = userResult.rows[0];
            
            // Get favorites from favorites table
            const favoritesResult = await pool.query(
                'SELECT product_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
                [user.id]
            );
            user.favorites = favoritesResult.rows.map(row => row.product_id);
            
            // Deprecated cart JSONB - will be removed
            user.cart = {};
            
            res.json({ status: 'existing_user', user });
        } else {
            res.json({ status: 'guest', telegramUser: req.telegramUser });
        }
    } catch (error) {
        logger.error('Error validating user:', error);
        next(error);
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
        const user = await pool.query(
            'SELECT first_name, last_name, phone, username FROM users WHERE id = $1',
            [req.userId]
        );
        if (user.rows.length > 0) {
            const userProfile = user.rows[0];
            
            // REFACTORED: Get favorites from favorites table
            const favoritesResult = await pool.query(
                'SELECT product_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
                [req.userId]
            );
            userProfile.favorites = favoritesResult.rows.map(row => row.product_id);
            
            // Deprecated cart JSONB - will be removed
            userProfile.cart = {};
            
            res.json(userProfile);
        } else {
            // This case should not be hit if req.userId is correctly set for existing users.
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        next(error);
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
router.put('/profile', authenticate, async (req, res, next) => {
    const { first_name, last_name, phone } = req.body;
    const { id: telegram_id, username } = req.telegramUser;

    // Validatsiya - ism
    if (!first_name || !first_name.trim()) {
        return res.status(400).json({ error: 'Ism kiritish majburiy' });
    }

    // Validatsiya - telefon formati (+998XXXXXXXXX)
    if (!phone || !phone.match(/^\+998[0-9]{9}$/)) {
        return res
            .status(400)
            .json({ error: "Telefon raqam formati noto'g'ri. Namuna: +998901234567" });
    }

    // Validatsiya - O'zbekiston operatorlari
    const operatorCode = phone.slice(4, 6);
    const validOperators = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '71', '77'];
    if (!validOperators.includes(operatorCode)) {
        return res.status(400).json({ error: "Noto'g'ri O'zbekiston telefon raqami" });
    }

    try {
        // Use req.userId if it exists (user is being updated)
        // If it doesn't exist, it's a new user being created from a guest.
        if (req.userId) {
            // Update existing user
            const updatedUser = await pool.query(
                'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING id, first_name, last_name, phone, username',
                [first_name, last_name, phone, req.userId]
            );
            const user = updatedUser.rows[0];
            
            // Get favorites from favorites table
            const favoritesResult = await pool.query(
                'SELECT product_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
                [user.id]
            );
            user.favorites = favoritesResult.rows.map(row => row.product_id);
            user.cart = {};
            
            res.json(user);
        } else {
            // Create new user
            const newUser = await pool.query(
                'INSERT INTO users (telegram_id, first_name, last_name, phone, username) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, phone, username',
                [telegram_id, first_name, last_name, phone, username || null]
            );
            const user = newUser.rows[0];
            
            // New users have empty favorites and cart
            user.favorites = [];
            user.cart = {};
            
            res.status(201).json(user);
        }
    } catch (error) {
        logger.error('Error saving user profile:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'This user already exists.' });
        }
        next(error);
    }
});

// New route to update cart
router.put('/cart', authenticate, async (req, res, next) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    const { cart } = req.body;
    if (typeof cart !== 'object' || cart === null) {
        return res.status(400).json({ error: 'Invalid cart data' });
    }

    // Validation: Cart format tekshirish
    // Cart object bo'lishi kerak, key'lar product_id (integer), value'lar quantity (positive integer)
    try {
        for (const [key, value] of Object.entries(cart)) {
            const productId = parseInt(key);
            const quantity = parseInt(value);

            if (isNaN(productId) || productId <= 0) {
                return res.status(400).json({ error: `Invalid product ID in cart: ${key}` });
            }
            if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
                return res.status(400).json({
                    error: `Invalid quantity for product ID ${key}: must be a positive integer`,
                });
            }
        }

        // JSONB format tekshirish - JSON.stringify orqali
        JSON.stringify(cart);
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('circular')) {
            return res
                .status(400)
                .json({ error: 'Invalid cart data: circular reference detected' });
        }
        return res.status(400).json({ error: 'Invalid cart data format' });
    }

    try {
        await pool.query('UPDATE users SET cart = $1 WHERE id = $2', [cart, req.userId]);
        res.status(200).json({ message: 'Cart updated successfully' });
    } catch (error) {
        logger.error('Error updating cart:', error);
        next(error);
    }
});

// Get user favorites (from favorites table)
router.get('/favorites', authenticate, async (req, res, next) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }

    try {
        const result = await pool.query(
            `SELECT product_id FROM favorites 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.userId]
        );
        
        // Return array of product IDs (for backward compatibility)
        const favorites = result.rows.map(row => row.product_id);
        res.json({ favorites });
    } catch (error) {
        logger.error('Error fetching favorites:', error);
        next(error);
    }
});

// Update favorites (sync with favorites table)
router.put('/favorites', authenticate, async (req, res, next) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    
    const { favorites } = req.body;
    if (!Array.isArray(favorites)) {
        return res.status(400).json({ error: 'Invalid favorites data: must be an array' });
    }

    // Validation
    const seen = new Set();
    for (let i = 0; i < favorites.length; i++) {
        const productId = parseInt(favorites[i]);
        if (isNaN(productId) || productId <= 0) {
            return res.status(400).json({ 
                error: `Invalid product ID at index ${i}: must be a positive integer` 
            });
        }
        if (seen.has(productId)) {
            return res.status(400).json({ error: `Duplicate product ID: ${productId}` });
        }
        seen.add(productId);
    }

    try {
        // Delete all current favorites
        await pool.query('DELETE FROM favorites WHERE user_id = $1', [req.userId]);
        
        // Insert new favorites
        if (favorites.length > 0) {
            const values = favorites.map((productId, i) => 
                `($1, $${i + 2})`
            ).join(', ');
            
            await pool.query(
                `INSERT INTO favorites (user_id, product_id) VALUES ${values}`,
                [req.userId, ...favorites]
            );
        }
        
        logger.info('✅ Favorites synced:', { userId: req.userId, count: favorites.length });
        res.json({ message: 'Favorites updated successfully', count: favorites.length });
    } catch (error) {
        logger.error('Error updating favorites:', error);
        next(error);
    }
});

// Add single favorite
router.post('/favorites/:productId', authenticate, async (req, res, next) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    
    const productId = parseInt(req.params.productId);
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
        await pool.query(
            `INSERT INTO favorites (user_id, product_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, product_id) DO NOTHING`,
            [req.userId, productId]
        );
        
        logger.info('✅ Added to favorites:', { userId: req.userId, productId });
        res.status(201).json({ message: 'Added to favorites' });
    } catch (error) {
        logger.error('Error adding favorite:', error);
        next(error);
    }
});

// Remove single favorite
router.delete('/favorites/:productId', authenticate, async (req, res, next) => {
    if (!req.userId) {
        return res.status(403).json({ error: 'User not registered' });
    }
    
    const productId = parseInt(req.params.productId);
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
        await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
            [req.userId, productId]
        );
        
        logger.info('✅ Removed from favorites:', { userId: req.userId, productId });
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        logger.error('Error removing favorite:', error);
        next(error);
    }
});

// Admin tekshirish endpointi
router.get('/check-admin', authenticate, isAdmin, (req, res) => {
    // Agar bu yerga yetib kelsa, demak foydalanuvchi admin
    res.status(200).json({ is_admin: true });
});

module.exports = router;
