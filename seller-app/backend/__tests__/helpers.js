/**
 * Test Helpers
 * Utility functions for integration tests
 */

const request = require('supertest');
const db = require('../db');

/**
 * Get Express app instance for testing
 */
function getTestApp() {
    const app = require('../app');
    return app;
}

/**
 * Make authenticated request (with mock auth)
 * @param {object} app - Express app
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {object} data - Request body/data
 * @param {object} options - Additional options (headers, etc.)
 */
function authenticatedRequest(app, method, path, data = null, options = {}) {
    let req = request(app)[method.toLowerCase()](path);

    // Set default headers
    req = req.set('Accept', 'application/json');

    // Set mock authentication header (for test purposes)
    // In real tests, you might need to mock the auth middleware
    if (options.auth !== false) {
        req = req.set('x-test-user-id', options.userId || '12345');
        req = req.set('x-test-is-admin', options.isAdmin !== false ? 'true' : 'false');
    }

    // Set custom headers
    if (options.headers) {
        Object.keys(options.headers).forEach(key => {
            req = req.set(key, options.headers[key]);
        });
    }

    // Add request body/data
    if (data) {
        if (method.toUpperCase() === 'GET') {
            req = req.query(data);
        } else {
            req = req.send(data);
        }
    }

    return req;
}

/**
 * Create test product data
 */
function createTestProductData(overrides = {}) {
    return {
        name_uz: 'Test Product',
        name_ru: 'Тестовый продукт',
        description_uz: 'Test description',
        description_ru: 'Тестовое описание',
        price: 100,
        cost_price: 50,
        image_url: 'https://example.com/image.jpg',
        category_id: 1,
        sku: `TEST-${Date.now()}`,
        ...overrides,
    };
}

/**
 * Create test category data
 */
function createTestCategoryData(overrides = {}) {
    return {
        name_uz: 'Test Category',
        name_ru: 'Тестовая категория',
        image_url: 'https://example.com/category.jpg',
        ...overrides,
    };
}

/**
 * Clean up test data from database
 * @param {string} table - Table name
 * @param {object} condition - WHERE condition
 */
async function cleanupTestData(table, condition = {}) {
    if (Object.keys(condition).length === 0) {
        // Truncate table if no condition
        await db.query(`TRUNCATE TABLE ${table} CASCADE`);
    } else {
        // Delete with condition
        const whereClause = Object.keys(condition)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');
        const values = Object.values(condition);
        await db.query(`DELETE FROM ${table} WHERE ${whereClause}`, values);
    }
}

/**
 * Insert test data
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {object} Inserted record
 */
async function insertTestData(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
}

module.exports = {
    getTestApp,
    authenticatedRequest,
    createTestProductData,
    createTestCategoryData,
    cleanupTestData,
    insertTestData,
};
