/**
 * Health Check Route
 * Comprehensive server health check: database, memory, uptime, cache, environment
 */

const db = require('../db');
const cache = require('../utils/cache');

// Server start time
const serverStartTime = Date.now();

/**
 * Health check endpoint
 * GET /health
 *
 * Returns comprehensive health information:
 * - Overall status (healthy/unhealthy)
 * - Database connection and pool stats
 * - Memory usage
 * - Uptime
 * - Cache statistics
 * - Environment info
 */
async function healthCheck(req, res) {
    try {
        // Check all components
        const database = await checkDatabase();
        const memory = getMemoryUsage();
        const cacheStats = getCacheStats();
        const environment = getEnvironmentInfo();

        // Build health object
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'seller-app-backend',
            uptime: {
                seconds: Math.floor(process.uptime()),
                formatted: formatUptime(process.uptime()),
                started: new Date(serverStartTime).toISOString(),
            },
            memory,
            database,
            cache: cacheStats,
            environment,
        };

        // Determine overall status based on critical components
        if (database.status !== 'connected') {
            health.status = 'unhealthy';
        }

        // Check memory usage (warn if > 90%)
        if (memory.percentage > 90) {
            health.status = 'degraded';
            health.warnings = health.warnings || [];
            health.warnings.push('High memory usage detected');
        }

        // Return appropriate status code
        const statusCode =
            health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            service: 'seller-app-backend',
        });
    }
}

/**
 * Check database connection and pool stats
 */
async function checkDatabase() {
    try {
        const startTime = Date.now();
        await db.query('SELECT 1');
        const responseTime = Date.now() - startTime;

        // Get connection pool stats if available
        const pool = db;
        const poolStats = {
            totalCount: pool.totalCount || 0,
            idleCount: pool.idleCount || 0,
            waitingCount: pool.waitingCount || 0,
        };

        return {
            status: 'connected',
            responseTime: `${responseTime}ms`,
            pool: {
                total: poolStats.totalCount,
                idle: poolStats.idleCount,
                active: poolStats.totalCount - poolStats.idleCount,
                waiting: poolStats.waitingCount,
            },
        };
    } catch (error) {
        return {
            status: 'disconnected',
            error: error.message,
        };
    }
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
    const memory = process.memoryUsage();
    return {
        heapUsed: formatBytes(memory.heapUsed),
        heapTotal: formatBytes(memory.heapTotal),
        rss: formatBytes(memory.rss),
        external: formatBytes(memory.external),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
    };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    try {
        // If cache has stats method, use it
        if (cache && typeof cache.getStats === 'function') {
            return cache.getStats();
        }

        // Default cache stats (if cache exists but no stats method)
        return {
            enabled: true,
            size: 'N/A',
            hitRate: 'N/A',
        };
    } catch (error) {
        return {
            enabled: false,
            error: 'Cache stats unavailable',
        };
    }
}

/**
 * Get environment information
 */
function getEnvironmentInfo() {
    return {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
    };
}

/**
 * Format uptime to human readable format
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
        parts.push(`${secs}s`);
    }

    return parts.join(' ');
}

module.exports = {
    healthCheck,
};
