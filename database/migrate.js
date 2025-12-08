// database/migrate.js
// Migration runner - barcha migration'lar ni ketma-ket bajaradi

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 5, // Migration uchun kam connection
    idleTimeoutMillis: 30000
});

/**
 * Migration'lar ni bajarish
 */
async function runMigrations() {
    console.log('🔄 Starting database migrations...');

    try {
        // Migration version tracking table yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Migration tracking table created/verified');

        // Migration fayllarini o'qish
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.error('❌ Migrations directory not found:', migrationsDir);
            throw new Error('Migrations directory not found');
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Alfavit bo'yicha tartiblash

        console.log(`📦 Found ${files.length} migration files`);

        let applied = 0;
        let skipped = 0;

        for (const file of files) {
            // Version raqamini olish (001_amazing_store_core.sql -> 1)
            const versionMatch = file.match(/^(\d+)_/);
            if (!versionMatch) {
                console.warn(`⚠️  Skipping invalid migration file: ${file}`);
                continue;
            }

            const version = parseInt(versionMatch[1]);

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

            // Migration'ni bajarish
            console.log(`🔄 Running migration: ${file} (version ${version})`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // Transaction ichida bajarish
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
    // Pool'ni yopmaymiz, chunki backend'lar ishlatadi
    // Faqat CLI'da yopamiz
}

// Agar to'g'ridan-to'g'ri chaqirilsa (CLI)
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('✅ All migrations completed');
            pool.end(); // CLI'da pool'ni yopamiz
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            pool.end(); // CLI'da pool'ni yopamiz
            process.exit(1);
        });
}

module.exports = { runMigrations };

