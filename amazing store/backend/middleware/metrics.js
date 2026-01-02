/**
 * Metrics Collection Middleware
 * Tracks requests, response times, and errors
 */

const metrics = require('../utils/metrics');

/**
 * Metrics collection middleware
 * Should be added after request logger but before routes
 */  
function metricsMiddleware(req, res, next) {
    const startTime = Date.now();

    // Override res.end to capture response time and status code
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;
        const method = req.method;
        const path = req.route?.path || req.path || req.originalUrl;

        // Record metrics
        metrics.incrementRequest(method, path, statusCode, responseTime);

        // Call original end
        originalEnd.apply(this, args);
    };

    next();
}

module.exports = metricsMiddleware;
