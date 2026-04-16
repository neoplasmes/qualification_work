import { describe, expect, it } from 'vitest';

import { inferDatasetTypes } from './inferDatasetTypes';

describe('inferDatasetTypes', () => {
    it('returns empty array for empty dataset', () => {
        expect(inferDatasetTypes([])).toEqual([]);
    });

    it('infers primitive and mixed column types from preview rows', () => {
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

    it('returns string when column contains incompatible values', () => {
        const rows = [
            {
                mixed: '123',
                ambiguous: 'true',
            },
            {
                mixed: 'not a number',
                ambiguous: 1,
            },
        ];

        expect(inferDatasetTypes(rows)).toEqual([
            { key: 'mixed', dataType: 'string' },
            { key: 'ambiguous', dataType: 'string' },
        ]);
    });

    it('uses keys from the first row only', () => {
        const rows = [
            {
                stable: '1',
            },
            {
                stable: '2',
                ignored: 'value',
            },
        ];

        expect(inferDatasetTypes(rows)).toEqual([{ key: 'stable', dataType: 'number' }]);
    });
});
