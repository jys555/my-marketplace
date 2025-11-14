// backend/routes/products.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/products — barcha tovarlarni olish (til bilan)
router.get('/', async (req, res) => {
  const lang = req.query.lang || 'uz'; // 'uz' yoki 'ru'
  if (!['uz', 'ru'].includes(lang)) {
    return res.status(400).json({ error: 'Til faqat "uz" yoki "ru" bo\'lishi kerak' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, 
        COALESCE(
          CASE WHEN $1 = 'uz' THEN NULLIF(name_uz,'') ELSE NULLIF(name_ru,'') END,
          CASE WHEN $1 = 'uz' THEN name_ru ELSE name_uz END
        ) AS name,
        COALESCE(
          CASE WHEN $1 = 'uz' THEN NULLIF(description_uz,'') ELSE NULLIF(description_ru,'') END,
          CASE WHEN $1 = 'uz' THEN description_ru ELSE description_uz END
        ) AS description,
        price, 
        sale_price, 
        image_url AS image,
        COALESCE(sale_price, price) AS display_price
      FROM products
      ORDER BY created_at DESC
    `, [lang]);

    console.log('Query result:', result.rows); // Log the query result
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/products/:id — bitta tovar (til bilan)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const lang = ['uz', 'ru'].includes(req.query.lang) ? req.query.lang : 'uz';

  try {
    const result = await pool.query(
      `SELECT 
        id,
        COALESCE(
          CASE WHEN $2 = 'uz' THEN NULLIF(name_uz,'') ELSE NULLIF(name_ru,'') END,
          CASE WHEN $2 = 'uz' THEN name_ru ELSE name_uz END
        ) AS name,
        COALESCE(
          CASE WHEN $2 = 'uz' THEN NULLIF(description_uz,'') ELSE NULLIF(description_ru,'') END,
          CASE WHEN $2 = 'uz' THEN description_ru ELSE description_uz END
        ) AS description,
        price, sale_price, image_url,
        COALESCE(sale_price, price) AS display_price
       FROM products 
       WHERE id = $1`,
      [id, lang]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tovar topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/products — yangi tovar qo'shish (admin uchun)
router.post('/', async (req, res) => {
  const { name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url } = req.body;

  // Majburiy maydonlarni tekshirish
  if (!name_uz || !name_ru || !price || !image_url) {
    return res.status(400).json({ error: 'name_uz, name_ru, price, image_url majburiy' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tovar qo\'shishda xatolik' });
  }
});

module.exports = router;