import { describe, expect, it } from 'vitest';

import { getDayOfWeekOrder, isDayOfWeekValue } from './dayOfWeek';
import { inferDatasetTypes, isStrictDate, parseStrictDate } from './inferDatasetTypes';

describe('day of week lib', () => {
    it('recognizes English and Russian weekday labels', () => {
        expect(getDayOfWeekOrder('Monday')).toBe(1);
        expect(getDayOfWeekOrder('mon.')).toBe(1);
        expect(getDayOfWeekOrder('Понедельник')).toBe(1);
        expect(getDayOfWeekOrder('пн.')).toBe(1);
        expect(getDayOfWeekOrder('Sunday')).toBe(7);
        expect(getDayOfWeekOrder('sun')).toBe(7);
        expect(getDayOfWeekOrder('Воскресенье')).toBe(7);
        expect(getDayOfWeekOrder('вс')).toBe(7);
        expect(isDayOfWeekValue('Coffee')).toBe(false);
    });
});

describe('isStrictDate', () => {
    it('accepts ISO date-only', () => {
        expect(isStrictDate('2024-01-15')).toBe(true);
    });

    it('accepts ISO datetime with Z timezone', () => {
        expect(isStrictDate('2024-01-15T10:00:00.000Z')).toBe(true);
    });

    it('accepts ISO datetime with offset', () => {
        expect(isStrictDate('2024-01-15T10:00:00+03:00')).toBe(true);
    });

    it('accepts DD.MM.YYYY', () => {
        expect(isStrictDate('12.02.2005')).toBe(true);
    });

    it('accepts D.M.YYYY', () => {
        expect(isStrictDate('1.2.2005')).toBe(true);
    });

    it('rejects order ID string', () => {
        expect(isStrictDate('ORD-2023-151')).toBe(false);
    });

    it('rejects order ID that looks like partial ISO', () => {
        expect(isStrictDate('ORD-2023-01-15')).toBe(false);
    });

    it('rejects invalid Feb 31', () => {
        expect(isStrictDate('31.02.2005')).toBe(false);
    });

    it('rejects invalid month 13', () => {
        expect(isStrictDate('01.13.2024')).toBe(false);
    });

    it('rejects plain string', () => {
        expect(isStrictDate('Москва')).toBe(false);
    });
});

describe('parseStrictDate', () => {
    it('parses ISO date to ISO string', () => {
        expect(parseStrictDate('2024-01-15')).toBe('2024-01-15T00:00:00.000Z');
    });

    it('parses DD.MM.YYYY to correct ISO string', () => {
        expect(parseStrictDate('12.02.2005')).toBe('2005-02-12T00:00:00.000Z');
    });

    it('returns undefined for invalid date', () => {
        expect(parseStrictDate('ORD-2023-01-15')).toBeUndefined();
        expect(parseStrictDate('31.02.2005')).toBeUndefined();
    });
});

describe('inferDatasetTypes', () => {
    it('returns empty array for empty dataset', () => {
        expect(inferDatasetTypes([])).toEqual([]);
    });

    it('infers primitive column types', () => {
        const rows = [
            {
                age: '42',
                isActive: 'true',
                joinedAt: '2024-01-15T10:00:00.000Z',
                name: 'Alice',
                notes: null,
            },
            {
                age: 18,
                isActive: false,
                joinedAt: new Date('2024-01-16T10:00:00.000Z'),
                name: 'Bob',
                notes: '',
            },
            {
                age: undefined,
                isActive: 'false',
                joinedAt: '2024-01-17',
                name: 'Charlie',
                notes: 'needs review',
            },
        ];

        expect(inferDatasetTypes(rows)).toEqual([
            { key: 'age', dataType: 'number' },
            { key: 'isActive', dataType: 'bool' },
            { key: 'joinedAt', dataType: 'date' },
            { key: 'name', dataType: 'string' },
            { key: 'notes', dataType: 'string' },
        ]);
    });

    it('returns string for columns with incompatible mixed values', () => {
        const rows = [
            { mixed: '123', ambiguous: 'true' },
            { mixed: 'not a number', ambiguous: 1 },
        ];

        expect(inferDatasetTypes(rows)).toEqual([
            { key: 'mixed', dataType: 'string' },
            { key: 'ambiguous', dataType: 'string' },
        ]);
    });

    it('uses keys from the first row only', () => {
        const rows = [{ stable: '1' }, { stable: '2', ignored: 'value' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'stable', dataType: 'number' }]);
    });

    it('treats ORD-2023-151 as string, not date', () => {
        const rows = [{ orderId: 'ORD-2023-151' }, { orderId: 'ORD-2024-001' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'orderId', dataType: 'string' }]);
    });

    it('treats ORD-2023-01-15 as string (partial ISO in longer string)', () => {
        const rows = [{ ref: 'ORD-2023-01-15' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'ref', dataType: 'string' }]);
    });

    it('detects DD.MM.YYYY format as date', () => {
        const rows = [{ birthdate: '12.02.2005' }, { birthdate: '01.01.1990' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'birthdate', dataType: 'date' }]);
    });

    it('rejects invalid calendar date', () => {
        const rows = [{ d: '31.02.2005' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'd', dataType: 'string' }]);
    });

    it('detects yes/no and y/n as bool', () => {
        const rows = [{ flag: 'yes' }, { flag: 'no' }];
        expect(inferDatasetTypes(rows)).toEqual([{ key: 'flag', dataType: 'bool' }]);

        const rows2 = [{ v: 'y' }, { v: 'n' }];
        expect(inferDatasetTypes(rows2)).toEqual([{ key: 'v', dataType: 'bool' }]);
    });

    it('mixes yes and true into bool', () => {
        const rows = [{ v: 'yes' }, { v: 'true' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'v', dataType: 'bool' }]);
    });

    it('returns string when bool mixes with number', () => {
        const rows = [{ v: 'true' }, { v: '1' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'v', dataType: 'string' }]);
    });

    it('preserves Cyrillic column keys', () => {
        const rows = [
            { Город: 'Москва', Сумма: '100' },
            { Город: 'Казань', Сумма: '50' },
        ];

        expect(inferDatasetTypes(rows)).toEqual([
            { key: 'Город', dataType: 'string' },
            { key: 'Сумма', dataType: 'number' },
        ]);
    });

    it('returns string for all-empty column', () => {
        const rows = [{ x: null }, { x: undefined }, { x: '' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'x', dataType: 'string' }]);
    });

    it('infers day_of_week for weekday-only columns', () => {
        const rows = [
            { weekday: 'Wednesday' },
            { weekday: 'Понедельник' },
            { weekday: 'пт.' },
            { weekday: 'sun' },
        ];

        expect(inferDatasetTypes(rows)).toEqual([
            { key: 'weekday', dataType: 'day_of_week' },
        ]);
    });

    it('returns string when weekday values are mixed with other strings', () => {
        const rows = [{ weekday: 'Monday' }, { weekday: 'Not a day' }];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'weekday', dataType: 'string' }]);
    });
});
