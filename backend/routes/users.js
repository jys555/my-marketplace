// backend/routes/users.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// POST /api/users — foydalanuvchini yaratish/yangilash
// O'ZGARTIRILDI: 'authenticate' middleware olib tashlandi, chunki u server.js da qo'llanadi
router.post('/', async (req, res) => {
  const { first_name, last_name, phone, username } = req.body;
  const telegram_id = req.telegramId; // telegramId endi middleware'dan olinadi

  // first_name, last_name, phone majburiy
  if (!first_name || !last_name || !phone) {
    return res.status(400).json({ error: 'Ism, familiya va telefon raqami majburiy!' });
  }
  try {
    const query = `
      INSERT INTO users (telegram_id, first_name, last_name, username, phone)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        phone = EXCLUDED.phone
      RETURNING *;
    `;
    const values = [
      telegram_id,
      first_name,
      last_name,
      username || null,
      phone
    ];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/users/:telegram_id — foydalanuvchi ma'lumotlarini olish
router.get('/:telegram_id', async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT telegram_id, first_name, last_name, phone, username FROM users WHERE telegram_id = $1',
      [telegram_id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/users/check/:telegram_id — foydalanuvchi mavjudligi
router.get('/check/:telegram_id', async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegram_id]
    );
    if (result.rows.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;