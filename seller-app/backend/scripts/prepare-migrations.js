// scripts/prepare-migrations.js
// This script copies centralized migrations to backend directory before deployment
// Run this during Railway build process

const fs = require('fs');
const path = require('path');

const rootMigrationsDir = path.join(__dirname, '../../../database/migrations');
const targetMigrationsDir = path.join(__dirname, '../migrations/centralized');

console.log('🔄 Preparing migrations for deployment...');
console.log(`📁 Source: ${rootMigrationsDir}`);
console.log(`📁 Target: ${targetMigrationsDir}`);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetMigrationsDir)) {
    fs.mkdirSync(targetMigrationsDir, { recursive: true });
    console.log(`✅ Created directory: ${targetMigrationsDir}`);
}

// Copy migration files
if (fs.existsSync(rootMigrationsDir)) {
    const files = fs.readdirSync(rootMigrationsDir).filter(f => f.endsWith('.sql'));
    
    files.forEach(file => {
        const sourcePath = path.join(rootMigrationsDir, file);
        const targetPath = path.join(targetMigrationsDir, file);
        
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied: ${file}`);
    });
    
    console.log(`🎉 Copied ${files.length} migration files`);
} else {
    console.warn(`⚠️  Source migrations directory not found: ${rootMigrationsDir}`);
    console.warn('⚠️  Using existing migrations in migrations/centralized/');
}

