/**
 * Validation Middleware Tests
 * Tests for validate.js middleware functions
 */

const {
    required,
    string,
    number,
    integer,
    positive,
    url,
    email,
    boolean,
    array,
    oneOf,
    optional,
    stringLength,
    numberRange
} = require('./validate');

describe('Validation Helpers', () => {
    
    describe('required', () => {
        test('throws error if value is undefined', () => {
            expect(() => required(undefined, 'name')).toThrow('name is required');
        });

        test('throws error if value is null', () => {
            expect(() => required(null, 'name')).toThrow('name is required');
        });

        test('throws error if value is empty string', () => {
            expect(() => required('', 'name')).toThrow('name is required');
        });

        test('returns value if not empty', () => {
            expect(required('test', 'name')).toBe('test');
            expect(required(0, 'age')).toBe(0);
            expect(required(false, 'active')).toBe(false);
        });
    });

    describe('string', () => {
        test('returns undefined if value is undefined', () => {
            expect(string(undefined, 'name')).toBeUndefined();
        });

        test('trims string value', () => {
            expect(string('  test  ', 'name')).toBe('test');
        });

        test('throws error if value is not string', () => {
            expect(() => string(123, 'name')).toThrow('name must be a string');
        });

        test('returns trimmed string if valid', () => {
            expect(string('hello', 'name')).toBe('hello');
        });
    });

    describe('number', () => {
        test('returns undefined if value is undefined', () => {
            expect(number(undefined, 'price')).toBeUndefined();
        });

        test('parses string to number', () => {
            expect(number('123', 'price')).toBe(123);
        });

        test('throws error if value cannot be parsed', () => {
            expect(() => number('abc', 'price')).toThrow('price must be a number');
        });
    });

    describe('integer', () => {
        test('returns undefined if value is undefined', () => {
            expect(integer(undefined, 'age')).toBeUndefined();
        });

        test('parses string to integer', () => {
            expect(integer('123', 'age')).toBe(123);
        });

        test('throws error if value is not integer', () => {
            expect(() => integer(123.45, 'age')).toThrow('age must be an integer');
        });
    });

    describe('positive', () => {
        test('accepts positive numbers', () => {
            expect(positive(10, 'price')).toBe(10);
        });

        test('throws error if value is zero', () => {
            expect(() => positive(0, 'price')).toThrow();
        });

        test('throws error if value is negative', () => {
            expect(() => positive(-10, 'price')).toThrow();
        });
    });

    describe('url', () => {
        test('returns undefined if value is undefined', () => {
            expect(url(undefined, 'image_url')).toBeUndefined();
        });

        test('accepts valid URLs', () => {
            expect(url('https://example.com', 'image_url')).toBe('https://example.com');
        });

        test('throws error if value is invalid URL', () => {
            expect(() => url('not-a-url', 'image_url')).toThrow('image_url must be a valid URL');
        });
    });

    describe('email', () => {
        test('returns undefined if value is undefined', () => {
            expect(email(undefined, 'email')).toBeUndefined();
        });

        test('accepts valid emails', () => {
            expect(email('test@example.com', 'email')).toBe('test@example.com');
        });

        test('converts email to lowercase', () => {
            expect(email('Test@Example.COM', 'email')).toBe('test@example.com');
        });

        test('throws error if value is invalid email', () => {
            expect(() => email('not-an-email', 'email')).toThrow('email must be a valid email address');
        });
    });

    describe('boolean', () => {
        test('returns undefined if value is undefined', () => {
            expect(boolean(undefined, 'is_active')).toBeUndefined();
        });

        test('returns boolean if already boolean', () => {
            expect(boolean(true, 'is_active')).toBe(true);
            expect(boolean(false, 'is_active')).toBe(false);
        });

        test('parses string "true" to boolean', () => {
            expect(boolean('true', 'is_active')).toBe(true);
        });

        test('throws error if value is invalid', () => {
            expect(() => boolean('yes', 'is_active')).toThrow('is_active must be a boolean');
        });
    });

    describe('array', () => {
        test('returns undefined if value is undefined', () => {
            expect(array(undefined, 'items')).toBeUndefined();
        });

        test('returns array if valid', () => {
            const arr = [1, 2, 3];
            expect(array(arr, 'items')).toBe(arr);
        });

        test('throws error if value is not array', () => {
            expect(() => array('not-array', 'items')).toThrow('items must be an array');
        });
    });

    describe('oneOf', () => {
        test('returns undefined if value is undefined', () => {
            const validator = oneOf(['a', 'b', 'c']);
            expect(validator(undefined, 'status')).toBeUndefined();
        });

        test('accepts valid enum value', () => {
            const validator = oneOf(['new', 'processing', 'completed']);
            expect(validator('new', 'status')).toBe('new');
        });

        test('throws error if value is not in allowed values', () => {
            const validator = oneOf(['new', 'processing', 'completed']);
            expect(() => validator('invalid', 'status')).toThrow('status must be one of: new, processing, completed');
        });
    });

    describe('optional', () => {
        test('returns undefined if value is undefined', () => {
            const validator = optional(string);
            expect(validator(undefined, 'name')).toBeUndefined();
        });

        test('applies validator if value is provided', () => {
            const validator = optional(string);
            expect(validator('test', 'name')).toBe('test');
            expect(() => validator(123, 'name')).toThrow('name must be a string');
        });
    });

    describe('stringLength', () => {
        test('accepts string within length range', () => {
            const validator = stringLength(5, 10);
            expect(validator('hello', 'name')).toBe('hello');
        });

        test('throws error if string is too short', () => {
            const validator = stringLength(5, 10);
            expect(() => validator('hi', 'name')).toThrow('name must be at least 5 characters');
        });
    });

    describe('numberRange', () => {
        test('accepts number within range', () => {
            const validator = numberRange(0, 100);
            expect(validator(50, 'age')).toBe(50);
        });

        test('throws error if number is below minimum', () => {
            const validator = numberRange(0, 100);
            expect(() => validator(-1, 'age')).toThrow('age must be between 0 and 100');
        });
    });
});
