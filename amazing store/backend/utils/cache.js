// PERFORMANCE: Memory cache utility
// Bu cache server xotirasida ma'lumotlarni saqlaydi

class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Cache'dan ma'lumot olish
     * @param {string} key - Cache key
     * @returns {any|null} - Cache'dan ma'lumot yoki null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // TTL (Time To Live) tekshirish
        const age = (Date.now() - item.timestamp) / 1000; // soniyalarda
        if (age > item.ttl) {
            // Eski ma'lumot - cache'dan o'chirish
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Cache'ga ma'lumot saqlash
     * @param {string} key - Cache key
     * @param {any} data - Saqlanadigan ma'lumot
     * @param {number} ttl - Time To Live (soniyalarda), default 300 (5 daqiqa)
     */
    set(key, data, ttl = 300) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Cache'dan ma'lumotni o'chirish
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Pattern bo'yicha cache'larni o'chirish (masalan: "categories:*")
     * @param {string} pattern - Pattern (wildcard qo'llab-quvvatlanadi)
     */
    deletePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Barcha cache'larni tozalash
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Cache stats olish (debug uchun)
     */
    getStats() {
        const stats = {
            totalKeys: this.cache.size,
            keys: [],
            totalSize: 0 // Tahminiy (JSON.stringify orqali)
        };

        for (const [key, item] of this.cache.entries()) {
            const age = (Date.now() - item.timestamp) / 1000;
            const remainingTTL = item.ttl - age;
            const size = JSON.stringify(item.data).length;

            stats.keys.push({
                key,
                age: Math.round(age),
                remainingTTL: Math.round(remainingTTL),
                size
            });
            stats.totalSize += size;
        }

        return stats;
    }

    /**
     * Eski cache'larni tozalash (TTL o'tgan)
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            const age = (now - item.timestamp) / 1000;
            if (age > item.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton instance
const cache = new MemoryCache();

// Har 1 daqiqada eski cache'larni tozalash
setInterval(() => {
    cache.cleanup();
}, 60 * 1000); // 1 daqiqa

module.exports = cache;
