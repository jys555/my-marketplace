const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Seller App API',
            version: '1.0.0',
            description: 'API documentation for Seller App - Multi-marketplace management system',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3001',
                description: 'Development server',
            },
            {
                url: 'https://seller-app-backend.railway.app',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                TelegramAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-telegram-data',
                    description: 'Telegram authentication data (from Telegram Mini App)',
                },
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'integer',
                            description: 'Internal product ID (hidden from frontend)',
                        },
                        name_uz: {
                            type: 'string',
                            description: 'Product name in Uzbek',
                        },
                        name_ru: {
                            type: 'string',
                            description: 'Product name in Russian',
                        },
                        description_uz: {
                            type: 'string',
                            description: 'Product description in Uzbek',
                        },
                        description_ru: {
                            type: 'string',
                            description: 'Product description in Russian',
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Product price',
                        },
                        sale_price: {
                            type: 'number',
                            format: 'float',
                            description: 'Product sale price (optional)',
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Product image URL',
                        },
                        category_id: {
                            type: 'integer',
                            description: 'Category ID',
                        },
                        category_name_uz: {
                            type: 'string',
                            description: 'Category name in Uzbek',
                        },
                        category_name_ru: {
                            type: 'string',
                            description: 'Category name in Russian',
                        },
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit (unique identifier)',
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Product active status',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Product creation date',
                        },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Order ID',
                        },
                        order_number: {
                            type: 'string',
                            description: 'Order number',
                        },
                        status: {
                            type: 'string',
                            enum: ['new', 'processing', 'ready', 'delivered', 'cancelled'],
                            description: 'Order status',
                        },
                        total_amount: {
                            type: 'number',
                            format: 'float',
                            description: 'Total order amount',
                        },
                        payment_method: {
                            type: 'string',
                            description: 'Payment method',
                        },
                        delivery_method: {
                            type: 'string',
                            description: 'Delivery method',
                        },
                        marketplace_id: {
                            type: 'integer',
                            description: 'Marketplace ID',
                        },
                        marketplace_name: {
                            type: 'string',
                            description: 'Marketplace name',
                        },
                        customer_name: {
                            type: 'string',
                            description: 'Customer name',
                        },
                        customer_phone: {
                            type: 'string',
                            description: 'Customer phone',
                        },
                        customer_address: {
                            type: 'string',
                            description: 'Customer address',
                        },
                        order_date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order date',
                        },
                        delivery_date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Delivery date',
                        },
                        items: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/OrderItem',
                            },
                        },
                        items_count: {
                            type: 'integer',
                            description: 'Number of items in order',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order creation date',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order last update date',
                        },
                    },
                },
                OrderItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Order item ID',
                        },
                        product_id: {
                            type: 'integer',
                            description: 'Product ID',
                        },
                        quantity: {
                            type: 'integer',
                            description: 'Item quantity',
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Item price',
                        },
                        product_name_uz: {
                            type: 'string',
                            description: 'Product name in Uzbek',
                        },
                        product_name_ru: {
                            type: 'string',
                            description: 'Product name in Russian',
                        },
                        product_image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Product image URL',
                        },
                    },
                },
                Marketplace: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Marketplace ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Marketplace name',
                        },
                        api_type: {
                            type: 'string',
                            description: 'API type',
                        },
                        api_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'API URL',
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Marketplace active status',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Marketplace creation date',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                        message: {
                            type: 'string',
                            description: 'Detailed error message',
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            description: 'Total number of items',
                        },
                        limit: {
                            type: 'integer',
                            description: 'Items per page',
                        },
                        offset: {
                            type: 'integer',
                            description: 'Offset for pagination',
                        },
                        hasMore: {
                            type: 'boolean',
                            description: 'Whether there are more items',
                        },
                        currentCount: {
                            type: 'integer',
                            description: 'Current page item count',
                        },
                    },
                },
            },
        },
        security: [
            {
                TelegramAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
