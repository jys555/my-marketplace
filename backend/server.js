require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

// Marshrutlarni import qilish
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(helmet({ contentSecurityPolicy: false })); // Xavfsizlik headerlari
app.use(cors()); // CORS sozlamalari
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API marshrutlari
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Frontend marshrutizatsiyasi uchun barcha so'rovlarni ushlab qolish
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});