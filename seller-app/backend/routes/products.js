const express = require('express');
const pool = require('../db');
const router = express.Router();
const {
    validateBody,
    validateParams,
    required,
    string,
    optional,
    number,
    positive,
    integer,
    url,
    boolean,
} = require('../middleware/validate');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/seller/products:
 *   get:
 *     summary: Get all products with pagination
 *     description: Retrieve a paginated list of products with optional filtering by category and search
 *     tags: [Products]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *         description: Number of products per page (1-200)
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name (UZ/RU) or SKU
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
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/seller/products - Barcha tovarlar (Amazing Store) - PERFORMANCE: Pagination bilan
router.get('/', async (req, res) => {
    try {
        logger.info('📦 GET /api/seller/products - Request received', { query: req.query });
        const { marketplace_id, search, category_id } = req.query;

        // PERFORMANCE: Pagination parametrlari
        const limit = parseInt(req.query.limit) || 50; // Seller App'da default 50 ta (ko'proq ko'rsatish uchun)
        const offset = parseInt(req.query.offset) || 0;

        // Limit va offset validatsiyasi
        const validLimit = Math.min(Math.max(limit, 1), 200); // 1-200 oralig'ida
        const validOffset = Math.max(offset, 0);

        const whereConditions = ['1=1']; // Base condition
        const params = [];
        let paramIndex = 1;

        if (category_id) {
            whereConditions.push(`p.category_id = $${paramIndex}`);
            params.push(category_id);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(
                `(p.name_uz ILIKE $${paramIndex} OR p.name_ru ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`
            );
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // PERFORMANCE: Total count olish (pagination uchun)
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            WHERE ${whereClause}
        `;
        const { rows: countRows } = await pool.query(countQuery, params);
        const total = parseInt(countRows[0].total);

        // PERFORMANCE: Faqat kerakli qismni olish (LIMIT/OFFSET)
        // Include ALL price fields from products (no separate product_prices table)
        const query = `
            SELECT 
                p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
                p.price, p.sale_price, p.cost_price, p.service_fee, 
                p.image_url, p.category_id, p.is_active,
                p.sku,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(validLimit, validOffset);

        const { rows } = await pool.query(query, params);

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        const products = rows.map(row => {
            const { id, ...rest } = row;
            return {
                ...rest,
                _id: id, // Yashirilgan ID (ichki ishlatish uchun)
            };
        });

        // PERFORMANCE: Pagination ma'lumotlari bilan javob qaytarish
        const hasMore = validOffset + rows.length < total;

        logger.info('📦 GET /api/seller/products - Response', {
            productsCount: products.length,
            total,
            limit: validLimit,
            offset: validOffset,
            hasMore,
        });

        res.json({
            products,
            pagination: {
                total,
                limit: validLimit,
                offset: validOffset,
                hasMore,
                currentCount: products.length,
            },
        });
    } catch (error) {
        logger.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/seller/products/{id}:
 *   get:
 *     summary: Get a single product by ID or SKU
 *     description: Retrieve product details by ID or SKU
 *     tags: [Products]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID or SKU
 *     responses:
 *       200:
 *         description: Successful response with product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/seller/products/:id - Bitta tovar
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            `
            SELECT 
                p.id, p.name_uz, p.name_ru, p.description_uz, p.description_ru,
                p.price, p.sale_price, p.image_url, p.category_id, p.is_active,
                p.sku,
                c.name_uz as category_name_uz, c.name_ru as category_name_ru,
                p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1 OR p.sku = $1
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        const { id: productId, ...rest } = rows[0];
        res.json({
            ...rest,
            _id: productId, // Yashirilgan ID (ichki ishlatish uchun)
        });
    } catch (error) {
        logger.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/seller/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the Amazing Store. SKU will be auto-generated if not provided.
 *     tags: [Products]
 *     security:
 *       - TelegramAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name_uz
 *               - price
 *             properties:
 *               name_uz:
 *                 type: string
 *                 description: Product name in Uzbek (required)
 *               name_ru:
 *                 type: string
 *                 description: Product name in Russian
 *               description_uz:
 *                 type: string
 *                 description: Product description in Uzbek
 *               description_ru:
 *                 type: string
 *                 description: Product description in Russian
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Product price (required, must be positive)
 *               sale_price:
 *                 type: number
 *                 format: float
 *                 description: Product sale price (optional, must be positive)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *               category_id:
 *                 type: integer
 *                 description: Category ID
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit (auto-generated if not provided)
 *               is_active:
 *                 type: boolean
 *                 description: Product active status
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/seller/products - Yangi tovar (Amazing Store)
router.post(
    '/',
    validateBody({
        sku: required(string),
        barcode: optional(string),
        name_uz: required(string),
        name_ru: optional(string),
        description_uz: optional(string),
        description_ru: optional(string),
        category_id: optional(integer),
        price: required(positive),
        sale_price: optional(positive),
        cost_price: optional(positive),
        service_fee: optional(positive),
        image_url: optional(url),
        is_active: optional(boolean),
        // Yandex Market integratsiyasi (ixtiyoriy)
        yandex_api_token: optional(string),
        yandex_campaign_id: optional(string),
        yandex_product_id: optional(string),
        // Uzum Market integratsiyasi (ixtiyoriy)
        uzum_api_token: optional(string),
        uzum_product_id: optional(string),
    }),
    async (req, res, next) => {
        try {
            const {
                sku,
                barcode,
                name_uz,
                name_ru,
                description_uz,
                description_ru,
                category_id,
                price,
                sale_price,
                cost_price,
                service_fee,
                image_url,
                is_active = true,
                // Yandex Market integratsiyasi
                yandex_api_token,
                yandex_campaign_id,
                yandex_product_id,
                // Uzum Market integratsiyasi
                uzum_api_token,
                uzum_product_id,
            } = req.body;

            // Check if SKU already exists
            const { rows: existing } = await pool.query('SELECT id FROM products WHERE sku = $1', [
                sku,
            ]);

            if (existing.length > 0) {
                return res.status(409).json({ error: 'SKU allaqachon mavjud' });
            }

            // VALIDATION: Log all incoming data
            logger.info('📦 Creating product with data:', {
                sku,
                price,
                sale_price,
                cost_price,
                service_fee,
                category_id,
            });

            // VALIDATION: Check required price fields
            if (!price || price <= 0) {
                logger.error('❌ Invalid price:', price);
                return res
                    .status(400)
                    .json({ error: "Price majburiy va 0 dan katta bo'lishi kerak" });
            }

            if (!cost_price || cost_price <= 0) {
                logger.error('❌ Invalid cost_price:', cost_price);
                return res
                    .status(400)
                    .json({ error: "Cost price majburiy va 0 dan katta bo'lishi kerak" });
            }

            if (service_fee === null || service_fee === undefined || service_fee < 0) {
                logger.error('❌ Invalid service_fee:', service_fee);
                return res
                    .status(400)
                    .json({ error: 'Service fee majburiy (0 yoki undan yuqori)' });
            }

            // Check if marketplace columns exist (for backward compatibility)
            const { rows: columnCheck } = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name IN ('yandex_api_token', 'uzum_api_token')
            `);
            const hasYandexColumns = columnCheck.some(c => c.column_name === 'yandex_api_token');
            const hasUzumColumns = columnCheck.some(c => c.column_name === 'uzum_api_token');

            // Build dynamic INSERT query
            let columns = [
                'sku', 'barcode', 'name_uz', 'name_ru', 'description_uz', 'description_ru',
                'category_id', 'price', 'sale_price', 'cost_price', 'service_fee', 'image_url', 'is_active'
            ];
            let values = [
                sku,
                barcode || null,
                name_uz,
                name_ru || null,
                description_uz || null,
                description_ru || null,
                category_id || null,
                price,
                sale_price || null,
                cost_price,
                service_fee,
                image_url || null,
                is_active,
            ];

            if (hasYandexColumns) {
                columns.push('yandex_api_token', 'yandex_campaign_id', 'yandex_product_id');
                values.push(
                    yandex_api_token || null,
                    yandex_campaign_id || null,
                    yandex_product_id || null
                );
            }

            if (hasUzumColumns) {
                columns.push('uzum_api_token', 'uzum_product_id');
                values.push(
                    uzum_api_token || null,
                    uzum_product_id || null
                );
            }

            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const { rows } = await pool.query(
                `INSERT INTO products (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *`,
                values
            );

            logger.info('✅ Product created successfully:', {
                sku,
                name_uz,
                id: rows[0].id,
                price: rows[0].price,
                cost_price: rows[0].cost_price,
                service_fee: rows[0].service_fee,
            });

            const productId = rows[0].id;

            // Marketplace integratsiyasi (agar berilgan bo'lsa)
            // Yandex Market sync (background'da)
            if (hasYandexColumns && yandex_api_token && yandex_campaign_id && yandex_product_id) {
                // Background'da sync qilish (to'xtatmaslik uchun)
                setImmediate(async () => {
                    try {
                        const marketplaceSync = require('../services/marketplace-sync');
                        await marketplaceSync.syncYandexProduct(productId);
                        logger.info('✅ Yandex Market product synced in background:', productId);
                    } catch (error) {
                        logger.error('⚠️ Yandex Market sync error (product still created):', error);
                    }
                });
            }

            // Uzum Market sync (background'da)
            if (hasUzumColumns && uzum_api_token && uzum_product_id) {
                // Background'da sync qilish (to'xtatmaslik uchun)
                setImmediate(async () => {
                    try {
                        const marketplaceSync = require('../services/marketplace-sync');
                        await marketplaceSync.syncUzumProduct(productId);
                        logger.info('✅ Uzum Market product synced in background:', productId);
                    } catch (error) {
                        logger.error('⚠️ Uzum Market sync error (product still created):', error);
                    }
                });
            }

            res.status(201).json(rows[0]);
        } catch (error) {
            if (error.code === '23505') {
                // Unique violation
                return next(new ConflictError('SKU already exists'));
            }
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   put:
 *     summary: Update a product by ID or SKU
 *     description: Update product details. All fields are optional - only provided fields will be updated.
 *     tags: [Products]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID or SKU
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name_uz:
 *                 type: string
 *                 description: Product name in Uzbek
 *               name_ru:
 *                 type: string
 *                 description: Product name in Russian
 *               description_uz:
 *                 type: string
 *                 description: Product description in Uzbek
 *               description_ru:
 *                 type: string
 *                 description: Product description in Russian
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Product price (must be positive)
 *               sale_price:
 *                 type: number
 *                 format: float
 *                 description: Product sale price (must be positive)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *               category_id:
 *                 type: integer
 *                 description: Category ID
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit (must be unique)
 *               is_active:
 *                 type: boolean
 *                 description: Product active status
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/seller/products/:id - Tovar yangilash (id yoki sku orqali)
router.put(
    '/:id',
    validateParams({
        id: required(string), // id yoki sku bo'lishi mumkin
    }),
    validateBody({
        name_uz: optional(string),
        name_ru: optional(string),
        description_uz: optional(string),
        description_ru: optional(string),
        price: optional(positive),
        sale_price: optional(positive),
        image_url: optional(url),
        category_id: optional(integer),
        sku: optional(string),
        is_active: optional(boolean),
    }),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const {
                name_uz,
                name_ru,
                description_uz,
                description_ru,
                price,
                sale_price,
                image_url,
                category_id,
                sku,
                is_active,
            } = req.body;

            // SKU yangilash bo'lsa, unique tekshirish
            if (sku) {
                const { rows: existing } = await pool.query(
                    'SELECT id FROM products WHERE sku = $1 AND (id != $2 OR id::text != $2)',
                    [sku, id]
                );
                if (existing.length > 0) {
                    return next(new ConflictError('SKU already exists'));
                }
            }

            const { rows } = await pool.query(
                `
            UPDATE products
            SET 
                name_uz = COALESCE($1, name_uz),
                name_ru = COALESCE($2, name_ru),
                description_uz = COALESCE($3, description_uz),
                description_ru = COALESCE($4, description_ru),
                price = COALESCE($5, price),
                sale_price = COALESCE($6, sale_price),
                image_url = COALESCE($7, image_url),
                category_id = COALESCE($8, category_id),
                sku = COALESCE($9, sku)
            WHERE id = $10
            RETURNING id, name_uz, name_ru, description_uz, description_ru, price, sale_price, image_url, category_id, is_active, sku, created_at
        `,
                [
                    name_uz,
                    name_ru,
                    description_uz,
                    description_ru,
                    price,
                    sale_price,
                    image_url,
                    category_id,
                    sku,
                    id,
                ]
            );

            if (rows.length === 0) {
                return next(new NotFoundError('Product'));
            }

            // ID'ni yashirish (frontend uchun SKU asosiy identifier)
            const { id: productId, ...rest } = rows[0];
            res.json({
                ...rest,
                _id: productId, // Yashirilgan ID (ichki ishlatish uchun)
            });
        } catch (error) {
            if (error.code === '23505') {
                // Unique violation
                return next(new ConflictError('SKU already exists'));
            }
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   delete:
 *     summary: Delete a product by ID or SKU
 *     description: Permanently delete a product from the database
 *     tags: [Products]
 *     security:
 *       - TelegramAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID or SKU
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *                 sku:
 *                   type: string
 *                   description: Deleted product SKU
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/seller/products/:id - Tovar o'chirish (id yoki sku orqali)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            `
            DELETE FROM products
            WHERE id = $1 OR sku = $1
            RETURNING id, sku
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // ID'ni yashirish (frontend uchun SKU asosiy identifier)
        res.json({
            message: 'Product deleted successfully',
            sku: rows[0].sku, // SKU'ni qaytarish (ID emas)
        });
    } catch (error) {
        logger.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
