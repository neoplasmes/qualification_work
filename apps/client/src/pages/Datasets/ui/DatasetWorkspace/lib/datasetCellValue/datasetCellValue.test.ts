import { datasetCellValueHandlers } from '.';
import { describe, expect, it } from 'vitest';

describe('dataset cell values', () => {
    it('validates and parses typed values', () => {
        expect(datasetCellValueHandlers.number.isValid('42.5')).toBe(true);
        expect(datasetCellValueHandlers.number.isValid('nope')).toBe(false);
        expect(datasetCellValueHandlers.number.parse('42.5')).toBe(42.5);

        expect(datasetCellValueHandlers.bool.isValid('true')).toBe(true);
        expect(datasetCellValueHandlers.bool.parse('false')).toBe(false);
    });

    it('parses date-only values without timezone shift', () => {
        expect(datasetCellValueHandlers.date.isValid('2026-05-26')).toBe(true);
        expect(datasetCellValueHandlers.date.parse('2026-05-26')).toBe(
            '2026-05-26T00:00:00.000Z'
        );
        expect(datasetCellValueHandlers.date.isValid('2026-02-31')).toBe(false);
    });

    it('formats dataset date cells as dd.mm.yyyy', () => {
        expect(datasetCellValueHandlers.date.format('2026-01-03')).toBe('03.01.2026');
        expect(datasetCellValueHandlers.date.format('2026-01-03T00:00:00.000Z')).toBe(
            '03.01.2026'
        );
        expect(datasetCellValueHandlers.date.format('1.2.2025')).toBe('01.02.2025');
        expect(datasetCellValueHandlers.string.format('Alice')).toBe('Alice');
    });

    it('accepts russian dd.mm.yyyy input that the grid shows by default', () => {
        expect(datasetCellValueHandlers.date.isValid('31.12.2026')).toBe(true);
        expect(datasetCellValueHandlers.date.parse('31.12.2026')).toBe(
            '2026-12-31T00:00:00.000Z'
        );

        expect(datasetCellValueHandlers.date.isValid('1.2.2025')).toBe(true);
        expect(datasetCellValueHandlers.date.parse('1.2.2025')).toBe(
            '2025-02-01T00:00:00.000Z'
        );

        expect(datasetCellValueHandlers.date.isValid('31.02.2025')).toBe(false);
    });

    it('validates and trims day_of_week values', () => {
        expect(datasetCellValueHandlers.day_of_week.isValid(' Monday ')).toBe(true);
        expect(datasetCellValueHandlers.day_of_week.isValid('пн.')).toBe(true);
        expect(datasetCellValueHandlers.day_of_week.isValid('coffee')).toBe(false);
        expect(datasetCellValueHandlers.day_of_week.parse(' Monday ')).toBe('Monday');
    });
});
