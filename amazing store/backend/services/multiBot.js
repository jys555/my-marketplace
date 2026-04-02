const { Bot } = require('grammy');
const pool = require('../db');
const logger = require('../utils/logger');

class MultiBotRegistry {
    constructor() {
        this.registry = new Map(); // sellerId -> { bot }
        this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL; // e.g., https://api.example.com
    }

    async startAll() {
        if (!this.webhookBaseUrl) {
            logger.warn('⚠️  WEBHOOK_BASE_URL not set; multi-bot webhooks will not be configured');
            return;
        }
        const { rows } = await pool.query(
            `SELECT id, bot_token FROM sellers WHERE is_active = true AND bot_token IS NOT NULL`
        );
        for (const row of rows) {
            await this.startForSeller(row.id, row.bot_token);
        }
        logger.info(`✅ MultiBotRegistry initialized for ${rows.length} sellers`);
    }

    async startForSeller(sellerId, token) {
        try {
            // Reuse existing instance if present
            if (this.registry.has(sellerId)) {
                await this.updateWebhook(sellerId);
                return;
            }
            const bot = new Bot(token);
            await bot.init(); // validate token
            const url = `${this.webhookBaseUrl.replace(/\/+$/,'')}/webhook/seller/${sellerId}`;
            await bot.api.setWebhook(url);
            this.registry.set(sellerId, { bot });
            logger.info(`🤖 Seller bot initialized and webhook set: seller_id=${sellerId}`);
        } catch (e) {
            logger.error(`❌ Failed to init seller bot seller_id=${sellerId}:`, e);
        }
    }

    async updateWebhook(sellerId) {
        if (!this.webhookBaseUrl) return;
        const entry = this.registry.get(sellerId);
        if (!entry) return;
        const url = `${this.webhookBaseUrl.replace(/\/+$/,'')}/webhook/seller/${sellerId}`;
        try {
            await entry.bot.api.setWebhook(url);
            logger.info(`🔁 Updated webhook for seller_id=${sellerId}`);
        } catch (e) {
            logger.error(`❌ Failed to update webhook for seller_id=${sellerId}:`, e);
        }
    }

    async stopSeller(sellerId) {
        const entry = this.registry.get(sellerId);
        if (!entry) return;
        try {
            await entry.bot.api.deleteWebhook();
        } catch (e) {
            // ignore
        }
        this.registry.delete(sellerId);
        logger.info(`🛑 Stopped seller bot seller_id=${sellerId}`);
    }
}

module.exports = new MultiBotRegistry();

