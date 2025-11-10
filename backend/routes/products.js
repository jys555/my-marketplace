// backend/routes/products.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/products — barcha tovarlarni olish
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        description, 
        price, 
        sale_price, 
        image_url AS image,
        COALESCE(sale_price, price) AS display_price
      FROM products
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/products/:id — bitta tovar
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
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

module.exports = router;