// Build vaqtida migration'lar copy qilish
// Source: database/migrations (monorepo root)
// Destination: seller-app/backend/migrations/centralized

const fs = require('fs');
const path = require('path');

const possibleSourceDirs = [
    // 1. Monorepo root (local development)
    path.join(__dirname, '../../../database/migrations'),
    // 2. Railway'da root directory = monorepo root bo'lsa
    path.join(process.cwd(), '../../database/migrations'),
    path.join(process.cwd(), '../../../database/migrations'),
    // 3. Absolute path (Railway'da)
    '/app/database/migrations',
    '/app/../database/migrations',
];

const destDir = path.join(__dirname, '../migrations/centralized');

// Source directory topish
let sourceDir = null;
for (const dir of possibleSourceDirs) {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
        if (files.length > 0) {
            sourceDir = dir;
            console.log(`📁 Found source migrations directory: ${sourceDir} (${files.length} files)`);
            break;
        }
    }
}

if (!sourceDir) {
    console.error('❌ Source migrations directory not found. Tried paths:');
    possibleSourceDirs.forEach(dir => console.error(`   - ${dir}`));
    // Railway'da build script ishlamayapti bo'lsa, xatolikni ko'rsatish
    // Lekin server ishga tushishi kerak (migration runner fallback ishlatadi)
    console.warn('⚠️  Build script failed, but server will continue (migration runner will use fallback)');
    process.exit(0); // Exit code 0 - server ishga tushishi kerak
}

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`📁 Created destination directory: ${destDir}`);
}

// Copy all .sql files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.sql'));
let copied = 0;

files.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const destFile = path.join(destDir, file);
    
    try {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ Copied ${file}`);
        copied++;
    } catch (error) {
        console.error(`❌ Error copying ${file}:`, error.message);
    }
});

console.log(`\n🎉 Copied ${copied}/${files.length} migration files to ${destDir}`);

