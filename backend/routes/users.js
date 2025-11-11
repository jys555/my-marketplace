// backend/routes/users.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// POST /api/users — foydalanuvchini yaratish/yangilash
router.post('/', async (req, res) => {
  const { telegram_id, first_name, last_name, phone } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id majburiy' });
  }

  try {
    const query = `
      INSERT INTO users (telegram_id, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone
      RETURNING *;
    `;
    const values = [telegram_id, first_name || null, last_name || null, phone || null];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/users/check/:telegram_id — foydalanuvchi mavjudligini tekshirish
router.get('/check/:telegram_id', async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE telegram_id = $1',
      [telegram_id]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;