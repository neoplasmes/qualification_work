import { describe, expect, it } from 'vitest';

import { formatDate } from './formatDate';

describe('formatDate', () => {
    it('formats time in 24-hour format', () => {
        const formatted = formatDate('2026-05-25T21:01:00.000Z');

        expect(formatted).toMatch(/\d{2}:\d{2}/);
        expect(formatted).not.toMatch(/PM|AM/);
    });
});
