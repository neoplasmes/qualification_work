import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Action } from '@/entities/action';

import { actionsTestIds } from '../../../const';

import { RunForm } from './RunForm';

const action: Action = {
    id: 'action-1',
    orgId: 'org-1',
    name: 'Receive payment',
    description: null,
    parameters: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'paid', label: 'Paid', type: 'bool', required: false },
    ],
    effects: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
};

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

describe('RunForm', () => {
    it('updates run input values and submits the form', async () => {
        const user = userEvent.setup();
        const onRunValueChange = vi.fn();
        const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
        });
        const TestRunForm = () => {
            const [runValues, setRunValues] = useState({ amount: '', paid: '' });

            return (
                <RunForm
                    action={action}
                    runValues={runValues}
                    disabled={false}
                    lastRunMessage=""
                    onRunValueChange={(key, value) => {
                        onRunValueChange(key, value);
                        setRunValues(current => ({ ...current, [key]: value }));
                    }}
                    onSubmit={onSubmit}
                />
            );
        };
        const { container } = render(<TestRunForm />);
        const amountInput = getByDataTestId<HTMLInputElement>(
            container,
            actionsTestIds.runInput
        );

        expect(amountInput).toHaveAttribute('placeholder', 'number');

        await user.type(amountInput, '15');
        await user.selectOptions(
            getByDataTestId(container, actionsTestIds.runBoolSelect),
            'false'
        );
        await user.click(getByDataTestId(container, actionsTestIds.runButton));

        expect(onRunValueChange).toHaveBeenCalledWith('amount', '1');
        expect(onRunValueChange).toHaveBeenCalledWith('amount', '15');
        expect(onRunValueChange).toHaveBeenCalledWith('paid', 'false');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('rejects text in numeric run inputs', async () => {
        const user = userEvent.setup();
        const onRunValueChange = vi.fn();
        const TestRunForm = () => {
            const [runValues, setRunValues] = useState({ amount: '', paid: '' });

            return (
                <RunForm
                    action={action}
                    runValues={runValues}
                    disabled={false}
                    lastRunMessage=""
                    onRunValueChange={(key, value) => {
                        onRunValueChange(key, value);
                        setRunValues(current => ({ ...current, [key]: value }));
                    }}
                    onSubmit={vi.fn()}
                />
            );
        };
        const { container } = render(<TestRunForm />);
        const amountInput = getByDataTestId<HTMLInputElement>(
            container,
            actionsTestIds.runInput
        );

        await user.type(amountInput, 'abc1x');

        expect(amountInput).toHaveValue('1');
        expect(onRunValueChange).toHaveBeenCalledTimes(1);
        expect(onRunValueChange).toHaveBeenCalledWith('amount', '1');
    });
});
