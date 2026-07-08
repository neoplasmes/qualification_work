import { describe, expect, it } from 'vitest';

import type { Action } from '@/entities/action';

import { filterActions } from './filterActions';

const baseAction: Action = {
    id: 'action-1',
    orgId: 'org-1',
    name: 'Receive payment',
    description: 'Marks invoice as paid',
    parameters: [
        {
            key: 'invoiceId',
            label: 'Invoice ID',
            type: 'string',
            required: true,
        },
    ],
    effects: [
        {
            kind: 'updateRowsByMatch',
            datasetId: 'dataset-1',
            match: { columnKey: 'id', parameterKey: 'invoiceId' },
            values: { status: { kind: 'literal', value: 'paid' } },
            maxRows: 1,
        },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
};

const otherAction: Action = {
    ...baseAction,
    id: 'action-2',
    name: 'Create invoice',
    effects: [{ ...baseAction.effects[0], datasetId: 'dataset-2' }],
};

describe('filterActions', () => {
    it('filters actions by dataset and effect without search text', () => {
        expect(
            filterActions({
                actions: [baseAction, otherAction],
                values: {
                    datasets: ['dataset-1'],
                    effects: ['updateRowsByMatch'],
                },
            })
        ).toEqual([baseAction]);
    });
});
