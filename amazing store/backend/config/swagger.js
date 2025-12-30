const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Amazing Store API',
            version: '1.0.0',
            description: 'API documentation for Amazing Store - E-commerce marketplace',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://amazing-store-backend.railway.app',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                TelegramAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-telegram-data',
                    description: 'Telegram authentication data (from Telegram Mini App)'
                }
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Product ID'
                        },
                        name_uz: {
                            type: 'string',
                            description: 'Product name in Uzbek'
                        },
                        name_ru: {
                            type: 'string',
                            description: 'Product name in Russian'
                        },
                        description_uz: {
                            type: 'string',
                            description: 'Product description in Uzbek'
                        },
                        description_ru: {
                            type: 'string',
                            description: 'Product description in Russian'
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Product price'
                        },
                        sale_price: {
                            type: 'number',
                            format: 'float',
                            description: 'Product sale price (optional)'
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Product image URL'
                        },
                        category_id: {
                            type: 'integer',
                            description: 'Category ID'
                        },
                        category_name_uz: {
                            type: 'string',
                            description: 'Category name in Uzbek'
                        },
                        category_name_ru: {
                            type: 'string',
                            description: 'Category name in Russian'
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Product active status'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Product creation date'
                        }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Order ID'
                        },
                        order_number: {
                            type: 'string',
                            description: 'Order number'
                        },
                        status: {
                            type: 'string',
                            enum: ['new', 'processing', 'ready', 'delivered', 'cancelled'],
                            description: 'Order status'
                        },
                        total_amount: {
                            type: 'number',
                            format: 'float',
                            description: 'Total order amount'
                        },
                        payment_method: {
                            type: 'string',
                            description: 'Payment method'
                        },
                        delivery_method: {
                            type: 'string',
                            description: 'Delivery method'
                        },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    product_id: {
                                        type: 'integer',
                                        description: 'Product ID'
                                    },
                                    quantity: {
                                        type: 'integer',
                                        description: 'Item quantity'
                                    },
                                    price: {
                                        type: 'number',
                                        format: 'float',
                                        description: 'Item price'
                                    }
                                }
                            }
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order creation date'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order last update date'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'User ID'
                        },
                        telegram_id: {
                            type: 'integer',
                            description: 'Telegram user ID'
                        },
                        first_name: {
                            type: 'string',
                            description: 'User first name'
                        },
                        last_name: {
                            type: 'string',
                            description: 'User last name'
                        },
                        phone: {
                            type: 'string',
                            description: 'User phone number'
                        },
                        username: {
                            type: 'string',
                            description: 'Telegram username'
                        },
                        cart: {
                            type: 'object',
                            description: 'User shopping cart'
                        },
                        favorites: {
                            type: 'array',
                            items: {
                                type: 'integer'
                            },
                            description: 'User favorite product IDs'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'User registration date'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Category ID'
                        },
                        name_uz: {
                            type: 'string',
                            description: 'Category name in Uzbek'
                        },
                        name_ru: {
                            type: 'string',
                            description: 'Category name in Russian'
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Category image URL'
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Category active status'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Category creation date'
                        }
                    }
                },
                Banner: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Banner ID'
                        },
                        title_uz: {
                            type: 'string',
                            description: 'Banner title in Uzbek'
                        },
                        title_ru: {
                            type: 'string',
                            description: 'Banner title in Russian'
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Banner image URL'
                        },
                        link_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Banner link URL'
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Banner active status'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Banner creation date'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        message: {
                            type: 'string',
                            description: 'Detailed error message'
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            description: 'Total number of items'
                        },
                        limit: {
                            type: 'integer',
                            description: 'Items per page'
                        },
                        offset: {
                            type: 'integer',
                            description: 'Offset for pagination'
                        },
                        hasMore: {
                            type: 'boolean',
                            description: 'Whether there are more items'
                        },
                        currentCount: {
                            type: 'integer',
                            description: 'Current page item count'
                        }
                    }
                }
            }
        },
        security: [
            {
                TelegramAuth: []
            }
        ]
    },
    apis: [
        './routes/*.js',
        './server.js'
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
