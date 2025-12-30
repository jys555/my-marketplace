/**
 * Frontend Validation Utilities
 * Backend validation bilan bir xil qoidalar
 */

// Error display CSS class
const ERROR_CLASS = 'validation-error';
const ERROR_MESSAGE_CLASS = 'error-message';

/**
 * Show error for a field
 */
function showError(field, message) {
    clearError(field);
    if (field.classList) {
        field.classList.add(ERROR_CLASS);
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = ERROR_MESSAGE_CLASS;
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    if (field.parentNode) {
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
}

/**
 * Clear error for a field
 */
function clearError(field) {
    if (field.classList) {
        field.classList.remove(ERROR_CLASS);
    }
    const errorMessage = field.parentNode?.querySelector(`.${ERROR_MESSAGE_CLASS}`);
    if (errorMessage) {
        errorMessage.remove();
    }
}

/**
 * Clear all errors in a form
 */
function clearAllErrors(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => clearError(field));
}

/**
 * Required field validation
 */
function validateRequired(value, fieldName) {
    if (value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        throw new Error(`${fieldName} is required`);
    }
    return value;
}

/**
 * String validation
 */
function validateString(value, fieldName, minLength = 0, maxLength = null) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const str = typeof value === 'string' ? value.trim() : String(value);
    if (minLength > 0 && str.length < minLength) {
        throw new Error(`${fieldName} must be at least ${minLength} characters`);
    }
    if (maxLength && str.length > maxLength) {
        throw new Error(`${fieldName} must be at most ${maxLength} characters`);
    }
    return str;
}

/**
 * Number validation
 */
function validateNumber(value, fieldName, min = null, max = null) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a number`);
    }
    if (min !== null && num < min) {
        throw new Error(`${fieldName} must be at least ${min}`);
    }
    if (max !== null && num > max) {
        throw new Error(`${fieldName} must be at most ${max}`);
    }
    return num;
}

/**
 * Positive number validation
 */
function validatePositive(value, fieldName) {
    return validateNumber(value, fieldName, 0.01);
}

/**
 * Integer validation
 */
function validateInteger(value, fieldName, min = null, max = null) {
    const num = validateNumber(value, fieldName, min, max);
    if (num === undefined) return undefined;
    if (!Number.isInteger(num)) {
        throw new Error(`${fieldName} must be an integer`);
    }
    return num;
}

/**
 * URL validation
 */
function validateURL(value, fieldName) {
    const str = validateString(value, fieldName);
    if (str === undefined) return undefined;
    try {
        new URL(str);
        return str;
    } catch {
        throw new Error(`${fieldName} must be a valid URL`);
    }
}

/**
 * Validate a form field
 */
function validateField(field, validator, fieldName) {
    try {
        const value = field.value;
        const result = validator(value, fieldName);
        clearError(field);
        return { valid: true, value: result };
    } catch (error) {
        showError(field, error.message);
        return { valid: false, error: error.message };
    }
}

/**
 * Validate form with schema
 */
function validateForm(form, schema) {
    clearAllErrors(form);
    const data = {};
    const errors = [];
    let isValid = true;

    for (const [fieldId, config] of Object.entries(schema)) {
        const field = form.querySelector(`#${fieldId}`);
        if (!field) {
            console.warn(`Field not found: ${fieldId}`);
            continue;
        }

        const { validator, fieldName } = config;
        const result = validateField(field, validator, fieldName || fieldId);

        if (!result.valid) {
            isValid = false;
            errors.push({ field: fieldId, message: result.error });
        } else if (result.value !== undefined) {
            data[fieldId] = result.value;
        }
    }

    return { valid: isValid, data, errors };
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.validation = {
        showError,
        clearError,
        clearAllErrors,
        validateRequired,
        validateString,
        validateNumber,
        validatePositive,
        validateInteger,
        validateURL,
        validateField,
        validateForm
    };
}
