const express = require('express');
const pool = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all active products with language support and pagination
 *     description: Retrieve a paginated list of active products. Products are returned in the specified language (UZ or RU).
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [uz, ru]
 *           default: uz
 *         description: Language for product names and descriptions (uz or ru)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of products per page (1-100)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Successful response with products and pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                         description: Product name in selected language
 *                       description:
 *                         type: string
 *                         description: Product description in selected language
 *                       price:
 *                         type: number
 *                         format: float
 *                       sale_price:
 *                         type: number
 *                         format: float
 *                       display_price:
 *                         type: number
 *                         format: float
 *                         description: Display price (sale_price if available, otherwise price)
 *                       image:
 *                         type: string
 *                         format: uri
 *                       category_id:
 *                         type: integer
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/products - Fetch all active products with language support and pagination
router.get('/', async (req, res) => {
    const allowedLangs = ['uz', 'ru'];
    const lang = allowedLangs.includes(req.query.lang) ? req.query.lang : 'uz';
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
    
    // PERFORMANCE: Pagination parametrlari
    const limit = parseInt(req.query.limit) || 20; // Default 20 ta
    const offset = parseInt(req.query.offset) || 0; // Default 0 dan boshlash
    
    // Limit va offset validatsiyasi
    const validLimit = Math.min(Math.max(limit, 1), 100); // 1-100 oralig'ida
    const validOffset = Math.max(offset, 0); // 0 dan kichik bo'lmasligi kerak

    try {
        // PERFORMANCE: WHERE shartlari (category va active uchun)
        let whereConditions = ['p.is_active = true'];
        const params = [lang];
        let paramIndex = 2; // $1 = lang, keyingilari $2 dan boshlanadi
        
        // Kategoriya bo'yicha filtrlash
        if (categoryId && !isNaN(categoryId)) {
            whereConditions.push(`p.category_id = $${paramIndex}`);
            params.push(categoryId);
            paramIndex++;
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        
        // PERFORMANCE: Total count olish (pagination uchun)
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            ${whereClause}
        `;
        const countParams = params.slice(1); // lang ni olib tashlaymiz count uchun
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].total);
        
        // PERFORMANCE: Faqat kerakli qismni olish (LIMIT/OFFSET)
        let query = `
            SELECT 
                p.id,
                CASE 
                    WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.name_ru, ''), p.name_uz)
                    ELSE p.name_uz 
                END as name,
                CASE 
                    WHEN $1 = 'ru' THEN COALESCE(NULLIF(p.description_ru, ''), p.description_uz)
                    ELSE p.description_uz 
                END as description,
                p.price, 
                p.sale_price, 
                p.image_url AS image,
                p.category_id,
                COALESCE(p.sale_price, p.price) AS display_price
            FROM products p
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(validLimit, validOffset);
        
        const { rows } = await pool.query(query, params);
        
        // PERFORMANCE: Pagination ma'lumotlari bilan javob qaytarish
        const hasMore = validOffset + rows.length < total;
        
        res.json({
            products: rows,
            pagination: {
                total,
                limit: validLimit,
                offset: validOffset,
                hasMore,
                currentCount: rows.length
            }
        });
    } catch (error) {
        logger.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/products - REMOVED
// Product yaratish endi Seller App'da amalga oshiriladi
// Amazing Store faqat client-facing API (GET only)
// Product management: Seller App -> /api/seller/products (POST, PUT, DELETE)

module.exports = router;