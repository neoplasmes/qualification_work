import { describe, expect, it } from 'vitest';

import { isValidDatasetCellValue, parseDatasetCellValue } from './datasetCellValue';

describe('dataset cell values', () => {
    it('validates and parses typed values', () => {
        expect(isValidDatasetCellValue('42.5', 'number')).toBe(true);
        expect(isValidDatasetCellValue('nope', 'number')).toBe(false);
        expect(parseDatasetCellValue('42.5', 'number')).toBe(42.5);

        expect(isValidDatasetCellValue('true', 'bool')).toBe(true);
        expect(parseDatasetCellValue('false', 'bool')).toBe(false);
    });

    it('parses date-only values without timezone shift', () => {
        expect(isValidDatasetCellValue('2026-05-26', 'date')).toBe(true);
        expect(parseDatasetCellValue('2026-05-26', 'date')).toBe(
            '2026-05-26T00:00:00.000Z'
        );
    });

    it('accepts russian dd.mm.yyyy input that the grid shows by default', () => {
        expect(isValidDatasetCellValue('31.12.2026', 'date')).toBe(true);
        expect(parseDatasetCellValue('31.12.2026', 'date')).toBe(
            '2026-12-31T00:00:00.000Z'
        );

        // single-digit day/month
        expect(isValidDatasetCellValue('1.2.2025', 'date')).toBe(true);
        expect(parseDatasetCellValue('1.2.2025', 'date')).toBe(
            '2025-02-01T00:00:00.000Z'
        );

        // calendar-invalid rolls over silently in Date - we must reject
        expect(isValidDatasetCellValue('31.02.2025', 'date')).toBe(false);
    });

    it('validates and trims day_of_week values', () => {
        expect(isValidDatasetCellValue(' Monday ', 'day_of_week')).toBe(true);
        expect(isValidDatasetCellValue('пн.', 'day_of_week')).toBe(true);
        expect(isValidDatasetCellValue('coffee', 'day_of_week')).toBe(false);
        expect(parseDatasetCellValue(' Monday ', 'day_of_week')).toBe('Monday');
    });
});
