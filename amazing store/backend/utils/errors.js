// Custom Error Classes for Better Error Handling

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Operational errors (expected)
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.originalError = originalError;
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

// PostgreSQL error code mapping
function mapPostgresError(error) {
    if (!error.code) {
        return new DatabaseError('Database error occurred', error);
    }

    switch (error.code) {
        case '23505': // Unique violation
            return new ConflictError('Resource already exists');
        
        case '23503': // Foreign key violation
            return new ValidationError('Referenced resource does not exist');
        
        case '23502': // Not null violation
            return new ValidationError('Required field is missing');
        
        case '42703': // Undefined column
            return new DatabaseError('Database schema error', error);
        
        case '42P01': // Undefined table
            return new DatabaseError('Database table does not exist', error);
        
        default:
            return new DatabaseError('Database operation failed', error);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    DatabaseError,
    ConflictError,
    mapPostgresError
};
