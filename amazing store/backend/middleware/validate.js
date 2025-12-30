const { ValidationError } = require('../utils/errors');

/**
 * Validation Middleware Factory
 * Generic validation middleware yaratish uchun
 */

/**
 * Request body validation middleware
 * @param {Object} schema - Validation schema (field: validation function)
 */
function validateBody(schema) {
    return (req, res, next) => {
        const errors = [];

        // Har bir field uchun validation
        for (const [field, validator] of Object.entries(schema)) {
            const value = req.body[field];

            try {
                const result = validator(value, field);
                if (result !== undefined && result !== null) {
                    // Validator yangi qiymat qaytarishi mumkin (sanitization)
                    req.body[field] = result;
                }
            } catch (error) {
                errors.push({
                    field,
                    message: error.message || `Invalid value for ${field}`
                });
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Validation failed', { errors }));
        }

        next();
    };
}

/**
 * Request query parameter validation
 * @param {Object} schema - Validation schema
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, validator] of Object.entries(schema)) {
            const value = req.query[field];

            try {
                const result = validator(value, field);
                if (result !== undefined && result !== null) {
                    req.query[field] = result;
                }
            } catch (error) {
                errors.push({
                    field,
                    message: error.message || `Invalid query parameter: ${field}`
                });
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Invalid query parameters', { errors }));
        }

        next();
    };
}

/**
 * Request parameter (URL params) validation
 * @param {Object} schema - Validation schema
 */
function validateParams(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, validator] of Object.entries(schema)) {
            const value = req.params[field];

            try {
                const result = validator(value, field);
                if (result !== undefined && result !== null) {
                    req.params[field] = result;
                }
            } catch (error) {
                errors.push({
                    field,
                    message: error.message || `Invalid parameter: ${field}`
                });
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Invalid URL parameters', { errors }));
        }

        next();
    };
}

// ============================================
// VALIDATION HELPERS (Validators)
// ============================================

/**
 * Required field validator
 */
function required(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        throw new Error(`${fieldName} is required`);
    }
    return value;
}

/**
 * String validator
 */
function string(value, fieldName) {
    if (value === undefined || value === null) {
        return undefined; // Optional field
    }
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
    }
    return value.trim();
}

/**
 * String with min/max length
 */
function stringLength(min, max) {
    return (value, fieldName) => {
        const str = string(value, fieldName);
        if (str === undefined) return undefined;
        if (str.length < min) {
            throw new Error(`${fieldName} must be at least ${min} characters`);
        }
        if (max && str.length > max) {
            throw new Error(`${fieldName} must be at most ${max} characters`);
        }
        return str;
    };
}

/**
 * Number validator
 */
function number(value, fieldName) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a number`);
    }
    return num;
}

/**
 * Integer validator
 */
function integer(value, fieldName) {
    const num = number(value, fieldName);
    if (num === undefined) return undefined;
    if (!Number.isInteger(num)) {
        throw new Error(`${fieldName} must be an integer`);
    }
    return num;
}

/**
 * Number range validator
 */
function numberRange(min, max) {
    return (value, fieldName) => {
        const num = number(value, fieldName);
        if (num === undefined) return undefined;
        if (num < min || num > max) {
            throw new Error(`${fieldName} must be between ${min} and ${max}`);
        }
        return num;
    };
}

/**
 * Positive number validator
 */
function positive(value, fieldName) {
    return numberRange(0.01, Infinity)(value, fieldName);
}

/**
 * Email validator
 */
function email(value, fieldName) {
    const str = string(value, fieldName);
    if (str === undefined) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(str)) {
        throw new Error(`${fieldName} must be a valid email address`);
    }
    return str.toLowerCase();
}

/**
 * URL validator
 */
function url(value, fieldName) {
    const str = string(value, fieldName);
    if (str === undefined) return undefined;
    try {
        new URL(str);
        return str;
    } catch {
        throw new Error(`${fieldName} must be a valid URL`);
    }
}

/**
 * Boolean validator
 */
function boolean(value, fieldName) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    throw new Error(`${fieldName} must be a boolean`);
}

/**
 * Array validator
 */
function array(value, fieldName) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
    }
    return value;
}

/**
 * Enum validator (allowed values)
 */
function oneOf(allowedValues) {
    return (value, fieldName) => {
        const str = string(value, fieldName);
        if (str === undefined) return undefined;
        if (!allowedValues.includes(str)) {
            throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
        }
        return str;
    };
}

/**
 * Optional validator wrapper
 */
function optional(validator) {
    return (value, fieldName) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return validator(value, fieldName);
    };
}

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
    // Validators
    required,
    string,
    stringLength,
    number,
    integer,
    numberRange,
    positive,
    email,
    url,
    boolean,
    array,
    oneOf,
    optional
};
