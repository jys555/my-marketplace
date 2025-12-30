/**
 * Metrics Collection Utility
 * In-memory metrics storage for request/response/error tracking
 */

class MetricsCollector {
    constructor() {
        this.reset();
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            requests: {
                total: 0,
                startTime: Date.now(),
                responses: [] // Response times for calculation
            },
            errors: {
                total: 0,
                byStatus: {} // Errors by status code (400, 404, 500, etc.)
            }
        };
    }

    /**
     * Increment request counter and track response time
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {string} path - Request path
     * @param {number} statusCode - HTTP status code
     * @param {number} responseTime - Response time in milliseconds
     */
    incrementRequest(method, path, statusCode, responseTime) {
        this.metrics.requests.total++;
        
        // Track response time (keep last 1000 for calculation)
        if (responseTime !== undefined && responseTime !== null) {
            this.metrics.requests.responses.push(responseTime);
            // Keep only last 1000 response times to avoid memory issues
            if (this.metrics.requests.responses.length > 1000) {
                this.metrics.requests.responses.shift();
            }
        }

        // Track errors (4xx and 5xx)
        if (statusCode >= 400) {
            this.incrementError(statusCode);
        }
    }

    /**
     * Increment error counter
     * @param {number} statusCode - HTTP status code
     */
    incrementError(statusCode) {
        this.metrics.errors.total++;
        const statusKey = statusCode.toString();
        if (!this.metrics.errors.byStatus[statusKey]) {
            this.metrics.errors.byStatus[statusKey] = 0;
        }
        this.metrics.errors.byStatus[statusKey]++;
    }

    /**
     * Get current metrics
     * @returns {object} Metrics object
     */
    getMetrics() {
        const uptime = Math.floor((Date.now() - this.metrics.requests.startTime) / 1000);
        const uptimeMinutes = Math.floor(uptime / 60);
        const uptimeHours = Math.floor(uptime / 3600);

        // Calculate response time statistics
        const responses = this.metrics.requests.responses;
        let responseTime = {
            avg: 0,
            min: 0,
            max: 0
        };

        if (responses.length > 0) {
            const sum = responses.reduce((a, b) => a + b, 0);
            responseTime = {
                avg: Math.round(sum / responses.length),
                min: Math.min(...responses),
                max: Math.max(...responses)
            };
        }

        // Calculate requests per minute/hour
        const requestsPerMinute = uptimeMinutes > 0 
            ? Math.round(this.metrics.requests.total / uptimeMinutes) 
            : this.metrics.requests.total;
        const requestsPerHour = uptimeHours > 0 
            ? Math.round(this.metrics.requests.total / uptimeHours) 
            : this.metrics.requests.total;

        // Calculate error rate (%)
        const errorRate = this.metrics.requests.total > 0
            ? Math.round((this.metrics.errors.total / this.metrics.requests.total) * 100 * 10) / 10
            : 0;

        // Group errors by type (4xx, 5xx)
        const errorsByType = {
            '4xx': 0,
            '5xx': 0
        };
        Object.keys(this.metrics.errors.byStatus).forEach(status => {
            const code = parseInt(status);
            if (code >= 400 && code < 500) {
                errorsByType['4xx'] += this.metrics.errors.byStatus[status];
            } else if (code >= 500) {
                errorsByType['5xx'] += this.metrics.errors.byStatus[status];
            }
        });

        return {
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: uptime,
                formatted: formatUptime(uptime)
            },
            requests: {
                total: this.metrics.requests.total,
                perMinute: requestsPerMinute,
                perHour: requestsPerHour
            },
            responseTime: responseTime,
            errors: {
                total: this.metrics.errors.total,
                rate: errorRate,
                '4xx': errorsByType['4xx'],
                '5xx': errorsByType['5xx'],
                byStatus: { ...this.metrics.errors.byStatus }
            }
        };
    }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

module.exports = metricsCollector;
