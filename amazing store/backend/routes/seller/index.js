const express = require('express');
const pool = require('../../db');
const logger = require('../../utils/logger');
const router = express.Router();

// Minimal admin endpoints (protect in real deployments)
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT id, name, bot_username, (bot_token IS NOT NULL) as bot_connected, is_active, created_at FROM sellers ORDER BY id DESC`
    );
    res.json(rows);
});

router.post('/', async (req, res) => {
    const { name, bot_username, bot_token, is_active = true } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO sellers (name, bot_username, bot_token, is_active) VALUES ($1,$2,$3,$4) RETURNING id`,
            [name, bot_username || null, bot_token || null, is_active]
        );
        res.json({ id: rows[0].id });
    } catch (e) {
        logger.error('Create seller failed', e);
        res.status(500).json({ error: 'create_failed' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, bot_username, bot_token, is_active } = req.body || {};
    try {
        await pool.query(
            `UPDATE sellers 
             SET name = COALESCE($2, name),
                 bot_username = COALESCE($3, bot_username),
                 bot_token = COALESCE($4, bot_token),
                 is_active = COALESCE($5, is_active)
             WHERE id = $1`,
            [id, name || null, bot_username || null, bot_token || null, is_active]
        );
        res.json({ ok: true });
    } catch (e) {
        logger.error('Update seller failed', e);
        res.status(500).json({ error: 'update_failed' });
    }
});

module.exports = router;

