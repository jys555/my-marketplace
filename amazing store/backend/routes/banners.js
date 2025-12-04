const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/banners - Fetch all active banners
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, title, image_url, link_url, is_active, sort_order FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;