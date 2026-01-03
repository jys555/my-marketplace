const { AppError, mapPostgresError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * Barcha error'larni catch qiladi va user-friendly response qaytaradi
 */
function errorHandler(err, req, res, next) {
    // Agar error allaqachon AppError bo'lsa, uni ishlatamiz
    let error = err;

    // PostgreSQL error'larini map qilish
    if ((error.code && error.code.startsWith('23')) || error.code.startsWith('42')) {
        error = mapPostgresError(error);
    }

    // Agar error AppError emas bo'lsa, InternalServerError qilamiz
    if (!(error instanceof AppError)) {
        error = new AppError(error.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
    }

    // Development vs Production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Error response
    const errorResponse = {
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An error occurred',
            ...(error.details && { details: error.details }),
            ...(isDevelopment && {
                stack: error.stack,
                originalError: error.originalError
                    ? {
                          message: error.originalError.message,
                          code: error.originalError.code,
                      }
                    : undefined,
            }),
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
        },
    };

    // Logging to FILE (NOT database)
    if (error.statusCode >= 500) {
        // Server errors - detailed logging to FILE
        logger.logError(error, req);
    } else {
        // Client errors - warning level to FILE
        logger.warn('Client error', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            request: {
                method: req.method,
                url: req.originalUrl || req.url,
                ip: req.ip || req.connection.remoteAddress,
                userId: req.telegramUser?.id || null,
            },
        });
    }

    // Response yuborish
    res.status(error.statusCode || 500).json(errorResponse);
}

module.exports = errorHandler;
