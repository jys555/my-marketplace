const logger = require('../../utils/logger');

class DeliveryService {
    async createShipment({ orderId, sellerId, service, payload }) {
        if (service === 'astrago') {
            return this.createAstragoShipment({ orderId, sellerId, payload });
        }
        if (service === 'seller_courier') {
            return this.createSellerCourierRecord({ orderId, sellerId, payload });
        }
        throw new Error(`Unsupported delivery service: ${service}`);
    }

    async createAstragoShipment({ orderId, sellerId, payload }) {
        // Placeholder: integrate Astrago API here
        logger.info(`Astrago shipment requested for order_id=${orderId} seller_id=${sellerId}`);
        return {
            delivery_service: 'astrago',
            tracking_id: `AST-${Date.now()}`,
            status: 'requested',
            meta: payload || {},
        };
    }

    async createSellerCourierRecord({ orderId, sellerId, payload }) {
        logger.info(`Seller courier delivery created for order_id=${orderId} seller_id=${sellerId}`);
        return {
            delivery_service: 'seller_courier',
            tracking_id: null,
            status: 'created',
            meta: payload || {},
        };
    }
}

module.exports = new DeliveryService();

