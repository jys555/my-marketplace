// backend/utils/initDb.js
const pool = require('../db');

async function initializeDatabase() {
    console.log('🔄 Database initialization started...');
    
    try {
        // 0. Users jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                username VARCHAR(255),
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255),
                phone VARCHAR(20),
                cart JSONB DEFAULT '{}',
                favorites INTEGER[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Users table created/verified');

        // 1. Products jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name_uz VARCHAR(255) NOT NULL,
                name_ru VARCHAR(255),
                description_uz TEXT,
                description_ru TEXT,
                price NUMERIC(10,2) NOT NULL,
                sale_price NUMERIC(10,2),
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Products table created/verified');

        // 2. Kategoriyalar jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name_uz VARCHAR(255) NOT NULL,
                name_ru VARCHAR(255) NOT NULL,
                icon VARCHAR(50),
                color VARCHAR(20),
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Categories table created/verified');

        // 3. Banners jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                image_url TEXT NOT NULL,
                link_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Banners table created/verified');

        // 4. Orders jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                order_number VARCHAR(100) UNIQUE,
                total_amount NUMERIC(10,2),
                status VARCHAR(50) DEFAULT 'new',
                payment_method VARCHAR(50),
                delivery_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Orders table created/verified');

        // 5. Order Items jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                price NUMERIC(10,2) NOT NULL
            )
        `);
        console.log('✅ Order_items table created/verified');

        // 6. Users jadvaliga updated_at ustuni qo'shish (agar yo'q bo'lsa)
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='updated_at'
                ) THEN
                    ALTER TABLE users 
                    ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
                    RAISE NOTICE 'Users.updated_at column added';
                END IF;
            END $$;
        `);
        console.log('✅ Users.updated_at column added/verified');

        // 6.1. Users jadvaliga is_admin ustuni qo'shish (agar yo'q bo'lsa)
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='is_admin'
                ) THEN
                    ALTER TABLE users 
                    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
                    RAISE NOTICE 'Users.is_admin column added';
                END IF;
            END $$;
        `);
        console.log('✅ Users.is_admin column added/verified');

        // 7. Products jadvaliga category_id ustuni qo'shish (agar yo'q bo'lsa)
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='products' AND column_name='category_id'
                ) THEN
                    ALTER TABLE products 
                    ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
                    RAISE NOTICE 'Products.category_id column added';
                END IF;
            END $$;
        `);
        console.log('✅ Products.category_id column added/verified');

        // 8. Indexlar qo'shish
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
        `);
        console.log('✅ Indexes created/verified');

        // 9. Dastlabki kategoriyalarni qo'shish (faqat bo'sh bo'lsa)
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM categories');
        
        if (parseInt(rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO categories (name_uz, name_ru, icon, color, sort_order) VALUES
                ('Mevalar', 'Фрукты', '🍎', '#ff6b6b', 1),
                ('Sabzavotlar', 'Овощи', '🥬', '#51cf66', 2),
                ('Sut mahsulotlari', 'Молочные продукты', '🥛', '#4dabf7', 3),
                ('Non mahsulotlari', 'Хлебобулочные изделия', '🍞', '#ffd43b', 4),
                ('Go''sht mahsulotlari', 'Мясные продукты', '🥩', '#f06595', 5),
                ('Ichimliklar', 'Напитки', '🥤', '#20c997', 6)
            `);
            console.log('✅ Default categories inserted (6 categories)');
        } else {
            console.log('ℹ️  Categories already exist, skipping insertion');
        }

        // 10. Keraksiz updated_at ustunlarini o'chirish (agar mavjud bo'lsa)
        // Categories'dan updated_at o'chirish
        await pool.query(`
            DO $$ 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='categories' AND column_name='updated_at'
                ) THEN
                    ALTER TABLE categories DROP COLUMN updated_at;
                    RAISE NOTICE 'Categories.updated_at column dropped';
                END IF;
            END $$;
        `);
        console.log('✅ Cleaned up unnecessary updated_at columns');

        // 11. Trigger yaratish (faqat users va orders uchun updated_at)
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Eski keraksiz trigger'larni o'chirish
        await pool.query(`
            DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
        `);
        console.log('✅ Removed old category triggers');

        // Users uchun trigger
        await pool.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Orders uchun trigger
        await pool.query(`
            DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
            CREATE TRIGGER update_orders_updated_at
                BEFORE UPDATE ON orders
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✅ Triggers created for users and orders');

        console.log('🎉 Database initialization completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };

