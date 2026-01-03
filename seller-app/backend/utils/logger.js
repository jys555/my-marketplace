/**
 * Winston Logger Configuration
 * Structured logging to files (NOT database)
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Logs directory
const logsDir = path.join(__dirname, '..', 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (pretty print for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Daily rotate file transport for general logs
const dailyRotateFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat,
    level: 'info',
});

// Daily rotate file transport for error logs
const dailyRotateErrorTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    format: logFormat,
    level: 'error',
});

// Console transport (only in development)
const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: logFormat,
    defaultMeta: { service: 'seller-app-backend' },
    transports: [dailyRotateFileTransport, dailyRotateErrorTransport],
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(consoleTransport);
}

// Helper methods for structured logging

/**
 * Log HTTP request
 */
logger.logRequest = function (req, res, responseTime) {
    this.info('HTTP request', {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.telegramUser?.id || null,
    });
};

/**
 * Log HTTP error
 */
logger.logError = function (error, req = null) {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
    };

    if (req) {
        errorInfo.request = {
            method: req.method,
            url: req.originalUrl || req.url,
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip || req.connection.remoteAddress,
            userId: req.telegramUser?.id || null,
        };
    }

    this.error('Error occurred', errorInfo);
};

/**
 * Log database error
 */
logger.logDatabaseError = function (error, query = null) {
    this.error('Database error', {
        message: error.message,
        code: error.code,
        query,
        stack: error.stack,
    });
};

/**
 * Log cache operation
 */
logger.logCache = function (operation, key, hit = null) {
    const logData = {
        operation, // 'get', 'set', 'delete', 'clear'
        key,
    };

    if (hit !== null) {
        logData.hit = hit; // true for cache hit, false for cache miss
    }

    this.debug('Cache operation', logData);
};

module.exports = logger;
