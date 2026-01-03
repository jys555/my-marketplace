/**
 * ESLint Configuration
 * Code quality and linting rules
 */

module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'standard',
        'prettier', // Disable ESLint rules that conflict with Prettier
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    rules: {
        // Custom rules
        'no-console': 'warn', // Warn on console.log (use logger instead)
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Allow unused vars with _ prefix
        'prefer-const': 'warn', // Prefer const over let
        'no-var': 'error', // Use let/const instead of var

        // Best practices
        eqeqeq: ['error', 'always'], // Always use ===
        curly: ['error', 'all'], // Always use curly braces

        // Database field naming - snake_case is allowed (database convention)
        // Disable camelcase rule - database fields use snake_case
        camelcase: 'off',

        // Node.js specific
        'no-process-exit': 'off', // Allow process.exit (server.js)
        'no-path-concat': 'warn', // Warn on path concatenation
    },
    ignorePatterns: [
        'node_modules/',
        'coverage/',
        'logs/',
        '*.log',
        'dist/',
        'build/',
        'scripts/**', // Ignore build scripts (console.log allowed)
        'utils/migrate.js', // Ignore migration utils (console.log allowed)
        'utils/initDb.js', // Ignore init utils (console.log allowed)
    ],
};
