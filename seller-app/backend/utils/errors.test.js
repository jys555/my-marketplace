/**
 * Error Classes Tests
 * Tests for error.js utility functions
 */

const {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    DatabaseError,
    ConflictError,
    mapPostgresError
} = require('./errors');

describe('Error Classes', () => {
    
    // ============================================
    // AppError Base Class
    // ============================================
    describe('AppError', () => {
        test('creates error with default status code 500', () => {
            const error = new AppError('Something went wrong');
            expect(error.message).toBe('Something went wrong');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('INTERNAL_ERROR');
            expect(error.isOperational).toBe(true);
        });

        test('creates error with custom status code', () => {
            const error = new AppError('Not found', 404);
            expect(error.statusCode).toBe(404);
        });

        test('creates error with custom code', () => {
            const error = new AppError('Error', 400, 'CUSTOM_ERROR');
            expect(error.code).toBe('CUSTOM_ERROR');
        });

        test('is instance of Error', () => {
            const error = new AppError('Test');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
        });

        test('has stack trace', () => {
            const error = new AppError('Test');
            expect(error.stack).toBeDefined();
        });
    });

    // ============================================
    // ValidationError
    // ============================================
    describe('ValidationError', () => {
        test('creates validation error with status 400', () => {
            const error = new ValidationError('Validation failed');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toBe('Validation failed');
        });

        test('includes details in error', () => {
            const details = { errors: [{ field: 'name', message: 'Required' }] };
            const error = new ValidationError('Validation failed', details);
            expect(error.details).toEqual(details);
        });

        test('is instance of AppError', () => {
            const error = new ValidationError('Test');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(ValidationError);
        });
    });

    // ============================================
    // NotFoundError
    // ============================================
    describe('NotFoundError', () => {
        test('creates not found error with status 404', () => {
            const error = new NotFoundError('Product');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toBe('Product not found');
        });

        test('is instance of AppError', () => {
            const error = new NotFoundError('Resource');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(NotFoundError);
        });
    });

    // ============================================
    // UnauthorizedError
    // ============================================
    describe('UnauthorizedError', () => {
        test('creates unauthorized error with status 401', () => {
            const error = new UnauthorizedError('Authentication required');
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.message).toBe('Authentication required');
        });

        test('is instance of AppError', () => {
            const error = new UnauthorizedError('Test');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(UnauthorizedError);
        });
    });

    // ============================================
    // ForbiddenError
    // ============================================
    describe('ForbiddenError', () => {
        test('creates forbidden error with status 403', () => {
            const error = new ForbiddenError('Access denied');
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('FORBIDDEN');
            expect(error.message).toBe('Access denied');
        });

        test('is instance of AppError', () => {
            const error = new ForbiddenError('Test');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(ForbiddenError);
        });
    });

    // ============================================
    // DatabaseError
    // ============================================
    describe('DatabaseError', () => {
        test('creates database error with status 500', () => {
            const error = new DatabaseError('Database connection failed');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.message).toBe('Database connection failed');
        });

        test('is instance of AppError', () => {
            const error = new DatabaseError('Test');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(DatabaseError);
        });
    });

    // ============================================
    // ConflictError
    // ============================================
    describe('ConflictError', () => {
        test('creates conflict error with status 409', () => {
            const error = new ConflictError('Resource already exists');
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
            expect(error.message).toBe('Resource already exists');
        });

        test('is instance of AppError', () => {
            const error = new ConflictError('Test');
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(ConflictError);
        });
    });

    // ============================================
    // mapPostgresError
    // ============================================
    describe('mapPostgresError', () => {
        test('maps unique violation (23505) to ConflictError', () => {
            const pgError = {
                code: '23505',
                detail: 'Key (sku)=(TEST-123) already exists.'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(ConflictError);
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
        });

        test('maps not null violation (23502) to ValidationError', () => {
            const pgError = {
                code: '23502',
                column: 'name_uz'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
        });

        test('maps foreign key violation (23503) to ValidationError', () => {
            const pgError = {
                code: '23503',
                detail: 'Key (category_id)=(999) is not present in table "categories".'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.statusCode).toBe(400);
        });

        test('maps undefined column (42703) to DatabaseError', () => {
            const pgError = {
                code: '42703',
                message: 'column "unknown_column" does not exist'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(DatabaseError);
            expect(error.statusCode).toBe(500);
        });

        test('maps syntax error (42601) to DatabaseError', () => {
            const pgError = {
                code: '42601',
                message: 'syntax error'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(DatabaseError);
            expect(error.statusCode).toBe(500);
        });

        test('returns DatabaseError for unknown error codes', () => {
            const pgError = {
                code: '99999',
                message: 'Unknown error'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(DatabaseError);
            expect(error.message).toContain('Unknown error');
        });

        test('handles error without code', () => {
            const pgError = {
                message: 'Some error'
            };
            const error = mapPostgresError(pgError);
            expect(error).toBeInstanceOf(DatabaseError);
        });
    });
});
