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

    it('validates and trims day_of_week values', () => {
        expect(isValidDatasetCellValue(' Monday ', 'day_of_week')).toBe(true);
        expect(isValidDatasetCellValue('пн.', 'day_of_week')).toBe(true);
        expect(isValidDatasetCellValue('coffee', 'day_of_week')).toBe(false);
        expect(parseDatasetCellValue(' Monday ', 'day_of_week')).toBe('Monday');
    });
});
