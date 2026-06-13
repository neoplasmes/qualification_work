import { createConfig, type ConfigBind } from '..';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FormField } from '@/shared/ui';

type DemoDraft = {
    title: string;
    filterEnabled: boolean;
    filter: {
        column: string;
        mode: 'eq' | 'contains';
        value: string;
    };
    measures: {
        aggregate: 'sum' | 'count';
        column: string;
    }[];
};

type DemoOutput = DemoDraft & {
    summary: string;
};

const demoConfig = createConfig<DemoDraft, DemoOutput>();

const defaultDraft: DemoDraft = {
    title: 'Revenue',
    filterEnabled: true,
    filter: {
        column: 'status',
        mode: 'eq',
        value: 'paid',
    },
    measures: [
        {
            aggregate: 'sum',
            column: 'amount',
        },
    ],
};

const toOutput = (normalizedDraft: DemoDraft): DemoOutput => ({
    ...normalizedDraft,
    summary: normalizedDraft.filter.column || 'none',
});

const titleBind = {
    get: draft => draft.title,
    set: (draft, value) => {
        draft.title = value;
    },
} satisfies ConfigBind<DemoDraft, string>;

const filterEnabledBind = {
    get: draft => draft.filterEnabled,
    set: (draft, value) => {
        draft.filterEnabled = value;
    },
} satisfies ConfigBind<DemoDraft, boolean>;

const filterColumnBind = {
    get: draft => draft.filter.column,
    set: (draft, value) => {
        draft.filter.column = value;
    },
} satisfies ConfigBind<DemoDraft, string>;

const measureAggregateBind = {
    get: draft => draft.measures[0]?.aggregate ?? 'sum',
    set: (draft, value) => {
        const measure = draft.measures[0];

        if (measure) {
            measure.aggregate = value;
        }
    },
} satisfies ConfigBind<DemoDraft, 'sum' | 'count'>;

const measureAggregateOptions = [
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' },
] as const;

const disableFilterOutput = (draft: DemoDraft) => {
    draft.filter.column = '';
    draft.filter.mode = 'eq';
    draft.filter.value = '';
};

const getLastCall = <T,>(mock: ReturnType<typeof vi.fn>) =>
    mock.mock.calls.at(-1)?.[0] as T;

const HookProbe = () => {
    const title = demoConfig.useInput(titleBind);
    const config = demoConfig.useConfig();

    return (
        <div>
            <span data-testid="hook-title">{title.value}</span>
            <span data-testid="hook-summary">{config.output.summary}</span>
            <button type="button" onClick={() => title.setValue('Hook title')}>
                Set hook title
            </button>
        </div>
    );
};

describe('Config', () => {
    it('updates uncontrolled draft fields', () => {
        const handleChange = vi.fn();

        render(
            <demoConfig.Root
                defaultValue={defaultDraft}
                onChange={handleChange}
                toOutput={toOutput}
            >
                <FormField label="Title">
                    <demoConfig.Input bind={titleBind} />
                </FormField>
            </demoConfig.Root>
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Profit' },
        });

        expect(screen.getByLabelText('Title')).toHaveValue('Profit');
        expect(getLastCall<DemoDraft>(handleChange).title).toBe('Profit');
    });

    it('reports controlled draft changes without mutating the prop object', () => {
        const handleChange = vi.fn();

        render(
            <demoConfig.Root
                value={defaultDraft}
                onChange={handleChange}
                toOutput={toOutput}
            >
                <FormField label="Title">
                    <demoConfig.Input bind={titleBind} />
                </FormField>
            </demoConfig.Root>
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Margin' },
        });

        expect(defaultDraft.title).toBe('Revenue');
        expect(getLastCall<DemoDraft>(handleChange).title).toBe('Margin');
    });

    it('updates object and array fields by bind objects', () => {
        const handleChange = vi.fn();

        render(
            <demoConfig.Root
                defaultValue={defaultDraft}
                onChange={handleChange}
                toOutput={toOutput}
            >
                <FormField label="Column">
                    <demoConfig.Input bind={filterColumnBind} />
                </FormField>
                <FormField label="Aggregate">
                    <demoConfig.Select
                        bind={measureAggregateBind}
                        options={measureAggregateOptions}
                    />
                </FormField>
            </demoConfig.Root>
        );

        fireEvent.change(screen.getByLabelText('Column'), {
            target: { value: 'country' },
        });
        fireEvent.change(screen.getByLabelText('Aggregate'), {
            target: { value: 'count' },
        });

        const nextDraft = getLastCall<DemoDraft>(handleChange);

        expect(nextDraft.filter.column).toBe('country');
        expect(nextDraft.measures[0]?.aggregate).toBe('count');
    });

    it('hides disabled sections, keeps draft values and normalizes output', async () => {
        const user = userEvent.setup();
        const handleOutputChange = vi.fn();

        render(
            <demoConfig.Root
                defaultValue={defaultDraft}
                onOutputChange={handleOutputChange}
                toOutput={toOutput}
            >
                <demoConfig.Section
                    name="Filter"
                    explain="Restrict rows before aggregation."
                    enabledBind={filterEnabledBind}
                    disabledOutput={disableFilterOutput}
                >
                    <FormField label="Column">
                        <demoConfig.Input bind={filterColumnBind} />
                    </FormField>
                </demoConfig.Section>
            </demoConfig.Root>
        );

        await user.clear(screen.getByLabelText('Column'));
        await user.type(screen.getByLabelText('Column'), 'country');
        await user.click(screen.getByRole('switch', { name: 'Filter' }));

        expect(screen.queryByLabelText('Column')).not.toBeInTheDocument();
        await waitFor(() =>
            expect(getLastCall<DemoOutput>(handleOutputChange).filter.column).toBe('')
        );

        await user.click(screen.getByRole('switch', { name: 'Filter' }));

        expect(screen.getByLabelText('Column')).toHaveValue('country');
        expect(screen.getByLabelText('Explain Filter')).toBeInTheDocument();
        await waitFor(() =>
            expect(getLastCall<DemoOutput>(handleOutputChange).filter.column).toBe(
                'country'
            )
        );
    });

    it('supports renderless input and typed hooks', async () => {
        const user = userEvent.setup();

        render(
            <demoConfig.Root defaultValue={defaultDraft} toOutput={toOutput}>
                <demoConfig.InputPropRenderer bind={titleBind}>
                    {field => (
                        <button
                            type="button"
                            onClick={() => field.setValue('Input title')}
                        >
                            Set input title
                        </button>
                    )}
                </demoConfig.InputPropRenderer>
                <HookProbe />
            </demoConfig.Root>
        );

        expect(screen.getByTestId('hook-title')).toHaveTextContent('Revenue');
        expect(screen.getByTestId('hook-summary')).toHaveTextContent('status');

        await user.click(screen.getByRole('button', { name: 'Set input title' }));
        expect(screen.getByTestId('hook-title')).toHaveTextContent('Input title');

        await user.click(screen.getByRole('button', { name: 'Set hook title' }));
        expect(screen.getByTestId('hook-title')).toHaveTextContent('Hook title');
    });

    it('renders as a form and prevents default submit', () => {
        const handleSubmit = vi.fn(event => {
            expect(event.defaultPrevented).toBe(true);
        });
        const { container } = render(
            <demoConfig.Root
                defaultValue={defaultDraft}
                onSubmit={handleSubmit}
                toOutput={toOutput}
            >
                <button type="submit">Save</button>
            </demoConfig.Root>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(container.firstElementChild?.tagName).toBe('FORM');
    });
});
