import { describe, expect, it } from 'vitest';

import { decorateFormattedNumber, normalizeNumberSuffix } from './formatNumberSuffix';

describe('decorateFormattedNumber', () => {
    it('adds custom suffixes to preformatted numbers', () => {
        expect(decorateFormattedNumber('1 200', 'шт')).toBe('1 200 шт');
        expect(decorateFormattedNumber('42', '%')).toBe('42%');
        expect(decorateFormattedNumber('42', '')).toBe('42');
    });

    it('supports legacy format tokens for saved charts', () => {
        expect(decorateFormattedNumber('1 200', 'rub')).toBe('1 200 ₽');
        expect(decorateFormattedNumber('12.50', 'percent')).toBe('12.50%');
        expect(decorateFormattedNumber('1 200', 'usd')).toBe('$1 200');
        expect(decorateFormattedNumber('-1 200', 'usd')).toBe('-$1 200');
    });
});

describe('normalizeNumberSuffix', () => {
    it('maps legacy suffix tokens and trims custom values', () => {
        expect(normalizeNumberSuffix('number')).toBe('');
        expect(normalizeNumberSuffix(' rub ')).toBe('₽');
        expect(normalizeNumberSuffix(' kg ')).toBe('kg');
    });
});
