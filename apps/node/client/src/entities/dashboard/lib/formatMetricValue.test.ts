import { describe, expect, it } from 'vitest';

import { formatMetricValue } from './formatMetricValue';

describe('formatMetricValue', () => {
    it('applies custom suffixes and multipliers', () => {
        expect(formatMetricValue(0.42, '%', 100)).toBe('42%');
        expect(formatMetricValue(1200, 'шт', 1)).toBe('1 200 шт');
        expect(formatMetricValue(1200, '', 1)).toBe('1 200');
    });

    it('keeps legacy metric formats readable', () => {
        expect(formatMetricValue(0.42, 'percent')).toBe('42%');
        expect(formatMetricValue(1200, 'currency')).toBe('1 200 ₽');
    });
});
