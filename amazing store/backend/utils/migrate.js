// backend/utils/migrate.js
// Wrapper for centralized migration runner
// LAZY LOADING - Path resolution runtime'da, module load vaqtida emas

const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config();

let cachedRunner = null;
let inlineRunnerPool = null; // Pool'ni saqlash uchun

/**
 * Create inline migration runner (fallback when centralized runner not found)
 */
function createInlineRunner() {
    // Pool'ni faqat bir marta yaratish (singleton pattern)
    if (!inlineRunnerPool) {
        inlineRunnerPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
            max: 5,
            idleTimeoutMillis: 30000,
        });
    }

    const pool = inlineRunnerPool;

    return {
        async runMigrations() {
            logger.info('🔄 Starting database migrations (inline runner)...');

            try {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version INTEGER PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP DEFAULT NOW()
                    )
                `);
                logger.info('✅ Migration tracking table created/verified');

                // Try multiple paths to find migrations directory
                // Real-world approach: Check multiple possible locations
                // Markazlashtirilgan migration'lar - barcha path'larni tekshirish
                // Railway'da working directory har xil bo'lishi mumkin
                const possibleMigrationDirs = [
                    // 1. Local migrations (build vaqtida copy qilingan) - BIRINCHI O'RINDA
                    // Bu Railway'da build script ishlaganda copy qilingan migration'lar
                    path.join(__dirname, '../migrations/centralized'),
                    path.join(process.cwd(), 'migrations/centralized'),
                    '/app/migrations/centralized',
                    // 2. Centralized migrations (monorepo root) - asosiy path
                    // amazing store/backend/utils/migrate.js -> ../../../database/migrations
                    path.join(__dirname, '../../../database/migrations'),
                    path.join(__dirname, '../../../../database/migrations'),
                    path.join(__dirname, '../../../../../database/migrations'),
                    path.join(__dirname, '../../../../../../database/migrations'),
                    // 3. process.cwd() orqali (Railway'da working directory)
                    // Railway'da working directory: /app (amazing store/backend)
                    // Monorepo root: /app/../.. (agar Railway root directory = monorepo root bo'lsa)
                    path.join(process.cwd(), '../../database/migrations'),
                    path.join(process.cwd(), '../../../database/migrations'),
                    path.join(process.cwd(), '../../../../database/migrations'),
                    // 4. Absolute path (Railway'da /app/database/migrations)
                    // Railway'da root directory = monorepo root bo'lsa
                    '/app/database/migrations',
                    '/app/../database/migrations',
                    // 5. Railway'da root directory = amazing store/backend bo'lsa
                    // Working directory: /app, root: /app
                    path.join(process.cwd(), 'database/migrations'),
                    // 6. Fallback migrations
                    path.join(__dirname, '../migrations'),
                ];

                let migrationsDir = null;
                let maxFiles = 0;
                const foundDirs = [];

                for (const dir of possibleMigrationDirs) {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
                        foundDirs.push({ dir, files: files.length });
                        // Eng ko'p migration fayllari bo'lgan papkani tanlash
                        // Bu markazlashtirilgan database/migrations papkasini topish uchun
                        if (files.length > maxFiles) {
                            maxFiles = files.length;
                            migrationsDir = dir;
                        }
                    }
                }

                // Debug: Barcha topilgan papkalarni ko'rsatish
                if (foundDirs.length > 0) {
                    logger.debug('📂 Found migration directories:');
                    foundDirs.forEach(({ dir, files }) => {
                        logger.debug(`   - ${dir} (${files} files)`);
                    });
                }

                if (migrationsDir) {
                    logger.info(
                        `📁 Selected migrations directory: ${migrationsDir} (${maxFiles} files)`
                    );
                }

                if (!migrationsDir) {
                    logger.error('❌ Migrations directory not found. Tried paths:');
                    possibleMigrationDirs.forEach(dir => logger.error(`   - ${dir}`));
                    throw new Error('Migrations directory not found');
                }

                const files = fs
                    .readdirSync(migrationsDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort();

                logger.info(`📦 Found ${files.length} migration files in ${migrationsDir}`);

                let applied = 0;
                let skipped = 0;

                for (const file of files) {
                    const versionMatch = file.match(/^(\d+)_/);
                    if (!versionMatch) {
                        logger.warn(`⚠️  Skipping invalid migration file: ${file}`);
                        continue;
                    }

                    const version = parseInt(versionMatch[1]);

                    // Special handling for RESET migration (000_RESET_DATABASE.sql)
                    const isResetMigration = file === '000_RESET_DATABASE.sql';
                    
                    if (!isResetMigration) {
                        const { rows } = await pool.query(
                            'SELECT version FROM schema_migrations WHERE version = $1',
                            [version]
                        );

                        if (rows.length > 0) {
                            logger.info(`⏭️  Migration ${file} already applied (version ${version})`);
                            skipped++;
                            continue;
                        }
                    } else {
                        logger.warn(`🔄 RESET MIGRATION DETECTED - Will run regardless of tracking`);
                    }

                    logger.info(`🔄 Running migration: ${file} (version ${version})`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');
                        await client.query(sql);
                        
                        // For reset migrations, recreate schema_migrations table
                        if (isResetMigration) {
                            await client.query(`
                                CREATE TABLE IF NOT EXISTS schema_migrations (
                                    version INTEGER PRIMARY KEY,
                                    name VARCHAR(255) NOT NULL,
                                    applied_at TIMESTAMP DEFAULT NOW()
                                );
                            `);
                        }
                        
                        await client.query(
                            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
                            [version, file]
                        );
                        await client.query('COMMIT');
                        logger.info(`✅ Migration ${file} completed successfully`);
                        applied++;
                    } catch (error) {
                        await client.query('ROLLBACK');
                        logger.error(`❌ Migration ${file} failed:`, error.message);
                        throw error;
                    } finally {
                        client.release();
                    }
                }

                logger.info(`\n🎉 Migrations completed: ${applied} applied, ${skipped} skipped`);
                return { applied, skipped, total: files.length };
            } catch (error) {
                logger.error('❌ Migration error:', error);
                throw error;
            }
        },
    };
}

/**
 * Get the centralized migration runner (lazy loading)
 * Tries to load from root database/migrate.js first, falls back to local copy if needed
 */
function getMigrationRunner() {
    // Cache'da bor bo'lsa, qaytarish
    if (cachedRunner) {
        return cachedRunner;
    }

    // 1. Try to load from root database/migrate.js (local development)
    const rootMigratePath = path.join(__dirname, '../../../database/migrate.js');

    if (fs.existsSync(rootMigratePath)) {
        try {
            cachedRunner = require(rootMigratePath);
            logger.info('✅ Using centralized migration runner:', rootMigratePath);
            return cachedRunner;
        } catch (error) {
            logger.warn('⚠️  Could not load root migration runner:', error.message);
        }
    }

    // 2. Fallback: Try to find migration runner in parent directories
    // This handles Railway deployment where root might be different
    const possiblePaths = [
        path.join(__dirname, '../../../../database/migrate.js'), // Railway root
        path.join(__dirname, '../../../../../database/migrate.js'), // Alternative Railway root
    ];

    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            try {
                cachedRunner = require(possiblePath);
                logger.info('✅ Using centralized migration runner:', possiblePath);
                return cachedRunner;
            } catch (error) {
                // Continue to next path
            }
        }
    }

    // 3. Fallback: Use inline migration runner (Railway deployment)
    // Markazlashtirilgan runner topilmasa, wrapper o'zining migration logikasini ishlatadi
    logger.warn('⚠️  Centralized migration runner not found, using inline runner');
    cachedRunner = createInlineRunner();
    return cachedRunner;
}

/**
 * Cleanup function - pool'ni yopish
 * Server yopilganda yoki kerak bo'lganda chaqiriladi
 */
async function cleanup() {
    if (inlineRunnerPool) {
        try {
            await inlineRunnerPool.end();
            inlineRunnerPool = null;
            logger.info('✅ Migration pool closed successfully');
        } catch (error) {
            logger.error('Error closing migration pool:', error);
        }
    }
}

// Process exit'da pool'ni yopish
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

// Export wrapper functions (lazy loading)
module.exports = {
    runMigrations: async function () {
        const runner = getMigrationRunner();
        return await runner.runMigrations();
    },
    cleanup,
};
