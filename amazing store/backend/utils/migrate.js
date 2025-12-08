// backend/utils/migrate.js
// Wrapper for centralized migration runner
// This file delegates to the centralized migration runner in database/migrate.js

const path = require('path');
const fs = require('fs');

/**
 * Get the centralized migration runner
 * Tries to load from root database/migrate.js first, falls back to local copy if needed
 */
function getMigrationRunner() {
    // 1. Try to load from root database/migrate.js (local development)
    const rootMigratePath = path.join(__dirname, '../../../database/migrate.js');
    
    if (fs.existsSync(rootMigratePath)) {
        try {
            return require(rootMigratePath);
        } catch (error) {
            console.warn('⚠️  Could not load root migration runner, using fallback:', error.message);
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
                return require(possiblePath);
            } catch (error) {
                // Continue to next path
            }
        }
    }
    
    // 3. Last resort: throw error with helpful message
    throw new Error(
        'Migration runner not found. ' +
        'Expected location: database/migrate.js (relative to project root). ' +
        'Tried paths: ' + [rootMigratePath, ...possiblePaths].join(', ')
    );
}

// Export the migration runner
const migrationRunner = getMigrationRunner();
module.exports = migrationRunner;
