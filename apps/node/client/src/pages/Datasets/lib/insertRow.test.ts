import { describe, expect, it } from 'vitest';

import type { DatasetColumn } from '@/entities/dataset';

import { getInsertRowData, isInsertRowValid } from './insertRow';

const columns: DatasetColumn[] = [
    {
        id: 'column-1',
        datasetId: 'dataset-1',
        key: 'amount',
        displayName: 'Amount',
        dataType: 'number',
        orderIndex: 0,
    },
    {
        id: 'column-2',
        datasetId: 'dataset-1',
        key: 'paid',
        displayName: 'Paid',
        dataType: 'bool',
        orderIndex: 1,
    },
];

describe('insert row helpers', () => {
    it('validates and converts new row values', () => {
        const values = { amount: '10', paid: 'false' };

        expect(isInsertRowValid(columns, values)).toBe(true);
        expect(getInsertRowData(columns, values)).toEqual({ amount: 10, paid: false });
    });

    it('allows partially filled rows and rejects fully empty drafts', () => {
        expect(isInsertRowValid(columns, { amount: '10', paid: '' })).toBe(true);
        expect(getInsertRowData(columns, { amount: '10', paid: '' })).toEqual({
            amount: 10,
        });

        expect(isInsertRowValid(columns, { amount: '', paid: '' })).toBe(false);
    });
});
