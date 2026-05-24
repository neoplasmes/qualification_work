import { describe, expect, it } from 'vitest';

import { coerceValueByType } from './coerceValueByType';

describe('coerceValueByType - date', () => {
    it('accepts ISO date string', () => {
        expect(coerceValueByType('2024-01-15', 'date', 'col')).toBe('2024-01-15T00:00:00.000Z');
    });

    it('accepts ISO datetime string', () => {
        const result = coerceValueByType('2024-01-15T10:00:00.000Z', 'date', 'col');
        expect(result).toBe('2024-01-15T10:00:00.000Z');
    });

    it('accepts DD.MM.YYYY and produces correct ISO', () => {
        expect(coerceValueByType('12.02.2005', 'date', 'col')).toBe('2005-02-12T00:00:00.000Z');
    });

    it('accepts Date instance', () => {
        const d = new Date('2024-03-01T00:00:00.000Z');
        expect(coerceValueByType(d, 'date', 'col')).toBe('2024-03-01T00:00:00.000Z');
    });

    it('throws for order-ID-like string', () => {
        expect(() => coerceValueByType('ORD-2023-01-15', 'date', 'orderId')).toThrow();
    });

    it('throws for invalid calendar date', () => {
        expect(() => coerceValueByType('31.02.2005', 'date', 'col')).toThrow();
    });

    it('returns null for empty string', () => {
        expect(coerceValueByType('', 'date', 'col')).toBeNull();
    });
});

describe('coerceValueByType - number', () => {
    it('parses numeric string', () => {
        expect(coerceValueByType('42', 'number', 'col')).toBe(42);
    });

    it('throws for non-numeric string', () => {
        expect(() => coerceValueByType('abc', 'number', 'col')).toThrow();
    });
});

describe('coerceValueByType - bool', () => {
    it('parses true/false strings', () => {
        expect(coerceValueByType('true', 'bool', 'col')).toBe(true);
        expect(coerceValueByType('FALSE', 'bool', 'col')).toBe(false);
    });

    it('throws for unrecognised value', () => {
        expect(() => coerceValueByType('yes', 'bool', 'col')).toThrow();
    });
});
