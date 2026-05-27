import { describe, expect, it } from 'vitest';

import { formatNumberWithSpaces } from './formatNumberWithSpaces';

describe('formatNumberWithSpaces', () => {
    it('groups integer digits with regular spaces', () => {
        expect(formatNumberWithSpaces(1_000)).toBe('1 000');
        expect(formatNumberWithSpaces(1_000_000_000_000_000)).toBe(
            '1 000 000 000 000 000'
        );
        expect(formatNumberWithSpaces(1e21)).toBe('1 000 000 000 000 000 000 000');
    });

    it('preserves sign and fractional part', () => {
        expect(formatNumberWithSpaces(-1234567.89)).toBe('-1 234 567.89');
        expect(formatNumberWithSpaces('1234567,50')).toBe('1 234 567,50');
    });
});
