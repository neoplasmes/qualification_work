import { describe, expect, it } from 'vitest';

import type { ActionParameter } from '@/entities/action';

import {
    coerceRunValues,
    getDefaultRunValues,
    isRunValueInputAllowed,
    validateRunValues,
} from './actionRunValues';

const parameters: ActionParameter[] = [
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'weekday', label: 'Weekday', type: 'day_of_week', required: false },
];

describe('actionRunValues', () => {
    it('allows only type-compatible input fragments', () => {
        expect(isRunValueInputAllowed('number', '12.5')).toBe(true);
        expect(isRunValueInputAllowed('number', '12a')).toBe(false);
        expect(isRunValueInputAllowed('date', '27-05')).toBe(true);
        expect(isRunValueInputAllowed('date', '27-aa')).toBe(false);
        expect(isRunValueInputAllowed('date', '2-')).toBe(false);
    });

    it('validates final run values by parameter type', () => {
        expect(
            validateRunValues(parameters, {
                amount: '15.5',
                date: '27-05-2026',
                weekday: 'пн',
            })
        ).toBeNull();
        expect(validateRunValues(parameters, { amount: 'abc' })).toBe(
            'Amount expects a number.'
        );
        expect(validateRunValues(parameters, { date: '31-02-2026' })).toBe(
            'Date expects a date in DD-MM-YYYY format.'
        );
        expect(validateRunValues(parameters, { weekday: 'coffee' })).toBe(
            'Weekday expects a weekday.'
        );
    });

    it('formats date values for inputs and payloads', () => {
        expect(
            getDefaultRunValues([
                {
                    key: 'date',
                    label: 'Date',
                    type: 'date',
                    defaultValue: '2026-05-27',
                },
            ])
        ).toEqual({ date: '27-05-2026' });
        expect(coerceRunValues(parameters, { date: '27-05-2026' })).toEqual({
            date: '2026-05-27',
        });
    });

    it('does not expose hidden parameters in run values', () => {
        const params: ActionParameter[] = [
            { key: 'qty', label: 'Qty', type: 'number', required: true },
            {
                key: 'unit',
                label: 'Unit',
                type: 'number',
                defaultValue: 100,
                hidden: true,
            },
        ];

        expect(getDefaultRunValues(params)).toEqual({ qty: '' });
        expect(coerceRunValues(params, { qty: '2', unit: '500' })).toEqual({
            qty: 2,
        });
        expect(validateRunValues(params, { qty: '2', unit: 'nope' })).toBeNull();
    });
});
