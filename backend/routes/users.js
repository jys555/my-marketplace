// backend/routes/users.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/users/:telegram_id — Foydalanuvchi ma'lumotlarini aqlli qaytarish
router.get('/:telegram_id', async (req, res) => {
  const requested_id = req.params.telegram_id;
  const requester_id = req.telegramId; // authenticate middleware'dan keladi

  try {
    let query;
    // Agar foydalanuvchi o'z ma'lumotini so'rayotgan bo'lsa
    if (String(requested_id) === String(requester_id)) {
      query = {
        text: 'SELECT telegram_id, first_name, last_name, phone, username, cart, favorites, is_admin FROM users WHERE telegram_id = $1',
        values: [requested_id],
      };
    } else {
      // Agar boshqa birov so'rayotgan bo'lsa (masalan, admin)
      // KELAJAK UCHUN: Bu yerga so'rovchi admin ekanligini tekshirish (isAdmin middleware) qo'shilishi kerak
      query = {
        text: 'SELECT telegram_id, first_name, last_name, phone, username, is_admin, created_at FROM users WHERE telegram_id = $1',
        values: [requested_id],
      };
    }

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // Agar so'rovchi o'zini qidirayotgan bo'lsa, bu uning hali ro'yxatdan o'tmaganini bildiradi
      if (String(requested_id) === String(requester_id)) {
        res.status(404).json({ error: 'Foydalanuvchi hali ro\'yxatdan o\'tmagan' });
      } else {
        res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
    }
  } catch (err) {
    console.error(`Error fetching user ${requested_id}:`, err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});


// POST /api/users — Yangi foydalanuvchini ro'yxatdan o'tkazish
router.post('/', async (req, res) => {
  const { first_name, last_name, phone, username } = req.body;
  const telegram_id = req.telegramId;

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
      RETURNING telegram_id, first_name, last_name, phone, username, cart, favorites, is_admin;
    `;
    const values = [ telegram_id, first_name, last_name, username || null, phone ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating/updating user:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/users/:telegram_id — Foydalanuvchi ma'lumotlarini (profil, cart, favorites) yangilash
router.put('/:telegram_id', async (req, res) => {
    const requested_id = req.params.telegram_id;
    const requester_id = req.telegramId;
    const { first_name, last_name, phone, cart, favorites } = req.body;

    // Foydalanuvchi faqat o'z ma'lumotlarini o'zgartira oladi
    if (String(requested_id) !== String(requester_id)) {
        return res.status(403).json({ error: "Ruxsat yo'q. Faqat o'z ma'lumotlaringizni o'zgartira olasiz." });
    }

    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (first_name !== undefined) {
        fields.push(`first_name = $${queryIndex++}`);
        values.push(first_name);
    }
    if (last_name !== undefined) {
        fields.push(`last_name = $${queryIndex++}`);
        values.push(last_name);
    }
    if (phone !== undefined) {
        fields.push(`phone = $${queryIndex++}`);
        values.push(phone);
    }
    if (cart !== undefined && Array.isArray(cart)) {
        fields.push(`cart = $${queryIndex++}`);
        values.push(JSON.stringify(cart));
    }
    if (favorites !== undefined && Array.isArray(favorites)) {
        fields.push(`favorites = $${queryIndex++}`);
        values.push(JSON.stringify(favorites));
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "Yangilash uchun hech qanday ma'lumot yuborilmadi." });
    }

    values.push(requester_id);
    const updateQuery = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE telegram_id = $${queryIndex}
        RETURNING telegram_id, first_name, last_name, phone, username, cart, favorites, is_admin;
    `;

    try {
        const result = await pool.query(updateQuery, values);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: "Foydalanuvchi topilmadi." });
        }
    } catch (err) {
        console.error('Error updating user data:', err);
        res.status(500).json({ error: 'Server xatosi' });
    }
});


// GET /api/users/check/:telegram_id — Bu endi kerak emas, lekin qoldirildi.
router.get('/check/:telegram_id', async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegram_id]);
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking user existence:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});


module.exports = router;