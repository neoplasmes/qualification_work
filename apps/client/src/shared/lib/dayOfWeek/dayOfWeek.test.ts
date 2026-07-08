import { describe, expect, it } from 'vitest';

import { compareCategoryLabels, getDayOfWeekOrder, isDayOfWeekValue } from './dayOfWeek';

describe('day of week helpers', () => {
    it('recognizes English and Russian weekday labels', () => {
        expect(getDayOfWeekOrder('Monday')).toBe(1);
        expect(getDayOfWeekOrder('mon.')).toBe(1);
        expect(getDayOfWeekOrder('Понедельник')).toBe(1);
        expect(getDayOfWeekOrder('пн.')).toBe(1);
        expect(getDayOfWeekOrder('Sunday')).toBe(7);
        expect(getDayOfWeekOrder('вс')).toBe(7);
        expect(isDayOfWeekValue('Coffee')).toBe(false);
    });

    it('sorts weekdays before regular strings and strings alphabetically', () => {
        expect(
            ['Zurich', 'Sunday', 'Monday', 'Amsterdam'].sort(compareCategoryLabels)
        ).toEqual(['Monday', 'Sunday', 'Amsterdam', 'Zurich']);
    });
});
