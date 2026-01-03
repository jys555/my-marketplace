/**
 * Request Logger Middleware
 * Logs all HTTP requests to file (NOT database)
 */

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs request method, URL, status code, response time, IP, user agent
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Override res.end to capture response time and status code
    const originalEnd = res.end;
    res.end = function (...args) {
        const responseTime = Date.now() - startTime;

        // Log request using logger helper
        logger.logRequest(req, res, responseTime);

        // Call original end
        originalEnd.apply(this, args);
    };

    next();
}

module.exports = requestLogger;
