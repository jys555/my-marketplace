/**
 * Metrics Route
 * GET /metrics - Returns server metrics
 */

const metrics = require('../utils/metrics');

/**
 * Get metrics endpoint
 * GET /metrics
 */
function getMetrics(req, res) {
    try {
        const metricsData = metrics.getMetrics();
        
        // Add service name
        metricsData.service = 'amazing-store-backend';
        
        res.json(metricsData);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get metrics',
            message: error.message
        });
    }
}

module.exports = {
    getMetrics
};
