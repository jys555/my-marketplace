// backend/utils/migrate.js
// Wrapper for centralized migration runner
// LAZY LOADING - Path resolution runtime'da, module load vaqtida emas

const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

let cachedRunner = null;

/**
 * Create inline migration runner (fallback when centralized runner not found)
 */
function createInlineRunner() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
    });

    return {
        async runMigrations() {
            console.log('🔄 Starting database migrations (inline runner)...');

            try {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version INTEGER PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP DEFAULT NOW()
                    )
                `);
                console.log('✅ Migration tracking table created/verified');

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
                    // seller-app/backend/utils/migrate.js -> ../../../database/migrations
                    path.join(__dirname, '../../../database/migrations'),
                    path.join(__dirname, '../../../../database/migrations'),
                    path.join(__dirname, '../../../../../database/migrations'),
                    path.join(__dirname, '../../../../../../database/migrations'),
                    // 3. process.cwd() orqali (Railway'da working directory)
                    // Railway'da working directory: /app (seller-app/backend)
                    // Monorepo root: /app/../.. (agar Railway root directory = monorepo root bo'lsa)
                    path.join(process.cwd(), '../../database/migrations'),
                    path.join(process.cwd(), '../../../database/migrations'),
                    path.join(process.cwd(), '../../../../database/migrations'),
                    // 4. Absolute path (Railway'da /app/database/migrations)
                    // Railway'da root directory = monorepo root bo'lsa
                    '/app/database/migrations',
                    '/app/../database/migrations',
                    // 5. Railway'da root directory = seller-app/backend bo'lsa
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
                    console.log('📂 Found migration directories:');
                    foundDirs.forEach(({ dir, files }) => {
                        console.log(`   - ${dir} (${files} files)`);
                    });
                }

                if (migrationsDir) {
                    console.log(
                        `📁 Selected migrations directory: ${migrationsDir} (${maxFiles} files)`
                    );
                }

                if (!migrationsDir) {
                    console.error('❌ Migrations directory not found. Tried paths:');
                    possibleMigrationDirs.forEach(dir => console.error(`   - ${dir}`));
                    throw new Error('Migrations directory not found');
                }

                const files = fs
                    .readdirSync(migrationsDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort();

                console.log(`📦 Found ${files.length} migration files in ${migrationsDir}`);

                let applied = 0;
                let skipped = 0;

                for (const file of files) {
                    const versionMatch = file.match(/^(\d+)_/);
                    if (!versionMatch) {
                        console.warn(`⚠️  Skipping invalid migration file: ${file}`);
                        continue;
                    }

                    const version = parseInt(versionMatch[1]);

                    // ⚠️ XAVFSIZLIK: RESET migration'larini production'da skip qilish
                    // 000_RESET_DATABASE.sql kabi migration'lar faqat development'da ishlatilishi kerak
                    // Production'da barcha ma'lumotlarni o'chirib yuboradi!
                    const isResetMigration =
                        file.toLowerCase().includes('reset') ||
                        file.toLowerCase().includes('000_reset') ||
                        (version === 0 && file.toLowerCase().includes('reset'));

                    if (isResetMigration) {
                        // Production environment'da RESET migration'ni skip qilish
                        const isProduction =
                            process.env.NODE_ENV === 'production' ||
                            process.env.RAILWAY_ENVIRONMENT === 'production' ||
                            process.env.ENVIRONMENT === 'production';

                        if (isProduction) {
                            console.warn(`⚠️  SKIPPING RESET migration in production: ${file}`);
                            console.warn(
                                `⚠️  This migration would DROP ALL TABLES and DELETE ALL DATA!`
                            );
                            skipped++;
                            continue;
                        }

                        // Development'da ham ogohlantirish
                        console.warn(`⚠️  WARNING: Running RESET migration: ${file}`);
                        console.warn(`⚠️  This will DROP ALL TABLES and DELETE ALL DATA!`);

                        // Development'da ham explicit ruxsat kerak
                        const allowResetInDev = process.env.ALLOW_RESET_MIGRATION === 'true';
                        if (!allowResetInDev) {
                            console.warn(
                                `⚠️  SKIPPING RESET migration. Set ALLOW_RESET_MIGRATION=true to allow.`
                            );
                            skipped++;
                            continue;
                        }
                    }

                    // Migration allaqachon bajarilganmi?
                    const { rows } = await pool.query(
                        'SELECT version FROM schema_migrations WHERE version = $1',
                        [version]
                    );

                    if (rows.length > 0) {
                        console.log(`⏭️  Migration ${file} already applied (version ${version})`);
                        skipped++;
                        continue;
                    }

                    console.log(`🔄 Running migration: ${file} (version ${version})`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');
                        await client.query(sql);
                        await client.query(
                            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                            [version, file]
                        );
                        await client.query('COMMIT');
                        console.log(`✅ Migration ${file} completed successfully`);
                        applied++;
                    } catch (error) {
                        await client.query('ROLLBACK');
                        console.error(`❌ Migration ${file} failed:`, error.message);
                        throw error;
                    } finally {
                        client.release();
                    }
                }

                console.log(`\n🎉 Migrations completed: ${applied} applied, ${skipped} skipped`);
                return { applied, skipped, total: files.length };
            } catch (error) {
                console.error('❌ Migration error:', error);
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
            console.log('✅ Using centralized migration runner:', rootMigratePath);
            return cachedRunner;
        } catch (error) {
            console.warn('⚠️  Could not load root migration runner:', error.message);
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
                console.log('✅ Using centralized migration runner:', possiblePath);
                return cachedRunner;
            } catch (error) {
                // Continue to next path
            }
        }
    }

    // 3. Fallback: Use inline migration runner (Railway deployment)
    // Markazlashtirilgan runner topilmasa, wrapper o'zining migration logikasini ishlatadi
    console.log('⚠️  Centralized migration runner not found, using inline runner');
    cachedRunner = createInlineRunner();
    return cachedRunner;
}

// Export wrapper functions (lazy loading)
module.exports = {
    runMigrations: async function () {
        const runner = getMigrationRunner();
        return await runner.runMigrations();
    },
};
