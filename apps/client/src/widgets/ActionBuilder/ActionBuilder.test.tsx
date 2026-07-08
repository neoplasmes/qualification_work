import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import type { DatasetMetadata } from '@/entities/dataset';

import { ActionBuilder } from './ActionBuilder';
import { actionBuilderTestIds } from './const';
import { createActionBuilderDraft, type ActionBuilderDraft } from './model';

const dataset: DatasetMetadata = {
    dataset: {
        id: 'dataset-1',
        orgId: 'org-1',
        name: 'Invoices',
        sourceType: 'manual',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    columns: [
        {
            id: 'column-1',
            datasetId: 'dataset-1',
            key: 'status',
            displayName: 'Status',
            dataType: 'string',
            orderIndex: 0,
            isAnalyzable: true,
        },
    ],
    totalRows: 3,
};

const getByDataTestId = <T extends HTMLElement>(
    container: HTMLElement,
    testId: string
) => {
    const element = container.querySelector<T>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as T;
};

const TestActionBuilder = () => {
    const [draft, setDraft] = useState<ActionBuilderDraft>(() =>
        createActionBuilderDraft()
    );

    return (
        <ActionBuilder
            value={draft}
            datasets={[dataset]}
            disabled={false}
            formId="test-action-builder"
            onChange={setDraft}
            onSubmit={event => event.preventDefault()}
        />
    );
};

describe('ActionBuilder', () => {
    it('updates central parameter inputs and keeps generated key visible', async () => {
        const user = userEvent.setup();
        const { container } = render(<TestActionBuilder />);
        const labelInput = getByDataTestId<HTMLInputElement>(
            container,
            actionBuilderTestIds.parameterLabelInput
        );
        const keyInput = getByDataTestId<HTMLInputElement>(
            container,
            actionBuilderTestIds.parameterKeyInput
        );

        await user.type(labelInput, 'Сумма оплаты');

        expect(keyInput).toHaveValue('сумма_оплаты');

        await user.selectOptions(
            getByDataTestId<HTMLSelectElement>(
                container,
                actionBuilderTestIds.parameterTypeSelect
            ),
            'number'
        );

        expect(
            getByDataTestId<HTMLSelectElement>(
                container,
                actionBuilderTestIds.parameterTypeSelect
            )
        ).toHaveValue('number');
    });

    it('adds rows and switches a value mapping to literal mode', async () => {
        const user = userEvent.setup();
        const { container } = render(<TestActionBuilder />);

        await user.click(screen.getByRole('button', { name: /Add parameter/i }));
        await user.click(screen.getByRole('button', { name: /Add value/i }));
        await user.click(
            getByDataTestId(container, actionBuilderTestIds.mappingSourceLiteralButton)
        );
        await user.type(
            getByDataTestId<HTMLInputElement>(
                container,
                actionBuilderTestIds.mappingLiteralInput
            ),
            'paid'
        );

        expect(
            container.querySelectorAll(
                `[data-test-id="${actionBuilderTestIds.parameterRow}"]`
            )
        ).toHaveLength(2);
        expect(
            container.querySelectorAll(
                `[data-test-id="${actionBuilderTestIds.mappingRow}"]`
            )
        ).toHaveLength(2);
        expect(
            getByDataTestId<HTMLInputElement>(
                container,
                actionBuilderTestIds.mappingLiteralInput
            )
        ).toHaveValue('paid');
    });

    it('renders computed mapping controls in one mapping row', async () => {
        const user = userEvent.setup();
        const { container } = render(<TestActionBuilder />);

        await user.click(
            getByDataTestId(container, actionBuilderTestIds.mappingSourceComputedButton)
        );

        expect(
            getByDataTestId<HTMLSelectElement>(
                container,
                actionBuilderTestIds.mappingComputedLeftParameterSelect
            )
        ).toBeInTheDocument();
        expect(
            getByDataTestId<HTMLSelectElement>(
                container,
                actionBuilderTestIds.mappingComputedOperationSelect
            )
        ).toHaveValue('*');
        expect(
            getByDataTestId<HTMLSelectElement>(
                container,
                actionBuilderTestIds.mappingComputedRightParameterSelect
            )
        ).toBeInTheDocument();
        expect(
            container.querySelectorAll(
                `[data-test-id="${actionBuilderTestIds.mappingRow}"]`
            )
        ).toHaveLength(1);
    });
});
