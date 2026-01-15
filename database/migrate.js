// database/migrate.js
// Migration runner - barcha migration'lar ni ketma-ket bajaradi
// MARKAZLASHTIRILGAN - Barcha backend'lar shu runner'dan foydalanadi

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
 * Multiple path resolution - local development va Railway deployment uchun
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
        // Markazlashtirilgan migration'lar - barcha path'larni tekshirish
        // Real-world approach: Check multiple possible locations
        const possibleMigrationDirs = [
            // 1. Standard centralized location (monorepo root) - asosiy path
            // database/migrate.js -> migrations/
            path.join(__dirname, 'migrations'),
            // 2. Alternative paths (Railway deployment)
            path.join(__dirname, '../database/migrations'),
            path.join(__dirname, '../../database/migrations'),
            path.join(__dirname, '../../../database/migrations'),
            // 3. process.cwd() orqali (Railway'da working directory)
            // Railway'da working directory: /app (agar root directory = monorepo root bo'lsa)
            path.join(process.cwd(), 'database/migrations'),
            path.join(process.cwd(), '../database/migrations'),
            path.join(process.cwd(), '../../database/migrations'),
            // 4. Absolute path (Railway'da /app/database/migrations)
            '/app/database/migrations',
            '/app/../database/migrations',
            // 5. Backend-specific copies (fallback, agar copy qilingan bo'lsa)
            path.join(__dirname, '../../seller-app/backend/migrations/centralized'),
            path.join(__dirname, '../../amazing store/backend/migrations/centralized'),
        ];
        
        let migrationsDir = null;
        let maxFiles = 0;
        for (const dir of possibleMigrationDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
                // Eng ko'p migration fayllari bo'lgan papkani tanlash
                // Bu markazlashtirilgan database/migrations papkasini topish uchun
                if (files.length > maxFiles) {
                    maxFiles = files.length;
                    migrationsDir = dir;
                    console.log(`📁 Found migrations directory: ${migrationsDir} (${files.length} files)`);
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
            .sort(); // Alfavit bo'yicha tartiblash

        console.log(`📦 Found ${files.length} migration files in ${migrationsDir}`);

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

            // ⚠️ XAVFSIZLIK: RESET migration'larini production'da skip qilish
            // 000_RESET_DATABASE.sql kabi migration'lar faqat development'da ishlatilishi kerak
            // Production'da barcha ma'lumotlarni o'chirib yuboradi!
            const isResetMigration = file.toLowerCase().includes('reset') || 
                                     file.toLowerCase().includes('000_reset') ||
                                     (version === 0 && file.toLowerCase().includes('reset'));
            
            if (isResetMigration) {
                // Production environment'da RESET migration'ni skip qilish
                const isProduction = process.env.NODE_ENV === 'production' || 
                                     process.env.RAILWAY_ENVIRONMENT === 'production' ||
                                     process.env.ENVIRONMENT === 'production';
                
                if (isProduction) {
                    console.warn(`⚠️  SKIPPING RESET migration in production: ${file}`);
                    console.warn(`⚠️  This migration would DROP ALL TABLES and DELETE ALL DATA!`);
                    skipped++;
                    continue;
                }
                
                // Development'da ham ogohlantirish
                console.warn(`⚠️  WARNING: Running RESET migration: ${file}`);
                console.warn(`⚠️  This will DROP ALL TABLES and DELETE ALL DATA!`);
                
                // Development'da ham explicit ruxsat kerak
                const allowResetInDev = process.env.ALLOW_RESET_MIGRATION === 'true';
                if (!allowResetInDev) {
                    console.warn(`⚠️  SKIPPING RESET migration. Set ALLOW_RESET_MIGRATION=true to allow.`);
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
