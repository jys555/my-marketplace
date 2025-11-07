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

// namuna products
INSERT INTO products (name, description, price, sale_price, image_url) VALUES
('Kapyushonli erkaklar kurtasi', 'Qishki issiq kurtka', 149000.00, 119000.00, 'https://via.placeholder.com/150x200/4a90e2/ffffff?text=Kurtka'),
('PowerBank 10000mAh', 'Portativ zaryadlovchi', 180000.00, 156600.00, 'https://via.placeholder.com/150x200/50c878/ffffff?text=PowerBank'),
('Quloqchin Bluetooth', 'Bekor qilishli mikrofonli', 120000.00, 99000.00, 'https://via.placeholder.com/150x200/ff6f61/ffffff?text=Quloqchin'),
('Baqirg‘ich shisha', 'Issiq va sovuq ichimliklar uchun', 55000.00, 45000.00, 'https://via.placeholder.com/150x200/9b59b6/ffffff?text=Shisha');

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