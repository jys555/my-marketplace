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
            rejectUnauthorized: false
        },
        max: 5,
        idleTimeoutMillis: 30000
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
                const possibleMigrationDirs = [
                    path.join(__dirname, '../migrations/centralized'), // Railway fallback
                    path.join(__dirname, '../migrations'), // Local migrations
                    path.join(__dirname, '../../../database/migrations'), // Root migrations
                ];
                
                let migrationsDir = null;
                for (const dir of possibleMigrationDirs) {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
                        if (files.length > 0) {
                            migrationsDir = dir;
                            console.log(`📁 Found migrations directory: ${migrationsDir} (${files.length} files)`);
                            break;
                        }
                    }
                }
                
                if (!migrationsDir) {
                    console.error('❌ Migrations directory not found. Tried paths:');
                    possibleMigrationDirs.forEach(dir => console.error(`   - ${dir}`));
                    throw new Error('Migrations directory not found');
                }

                const files = fs.readdirSync(migrationsDir)
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
        }
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
    runMigrations: async function() {
        const runner = getMigrationRunner();
        return await runner.runMigrations();
    }
};
