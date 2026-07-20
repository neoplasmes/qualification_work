import { createConfig, type ConfigBind } from '..';
import { Field } from '@qualification-work/design-system';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfigStore } from '../model';

type DemoDraft = {
    title: string;
    viewMode: 'table' | 'chart';
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

const demoConfig = createConfig<DemoDraft>();

const defaultDraft: DemoDraft = {
    title: 'Revenue',
    viewMode: 'chart',
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

const getLastCall = <T,>(mock: ReturnType<typeof vi.fn>) =>
    mock.mock.calls.at(-1)?.[0] as T;

const HookProbe = () => {
    const title = demoConfig.useInput(titleBind);
    const config = demoConfig.useConfig();

    return (
        <div>
            <span data-testid="hook-title">{title.value}</span>
            <span data-testid="hook-view-mode">{config.draft.viewMode}</span>
            <button type="button" onClick={() => title.setValue('Hook title')}>
                Set hook title
            </button>
        </div>
    );
};

describe('Config', () => {
    it('does not read bind value when setting a direct value', () => {
        const store = new ConfigStore<Pick<DemoDraft, 'title'>>({ title: 'Revenue' });
        const bind = {
            get: vi.fn(draft => draft.title),
            set: vi.fn((draft, value) => {
                draft.title = value;
            }),
        } satisfies ConfigBind<Pick<DemoDraft, 'title'>, string>;

        store.setValue(bind, 'Profit');

        expect(bind.get).not.toHaveBeenCalled();
        expect(bind.set).toHaveBeenCalledWith({ title: 'Profit' }, 'Profit');
    });

    it('reads bind value when setting with a function', () => {
        const store = new ConfigStore<Pick<DemoDraft, 'title'>>({ title: 'Revenue' });
        const bind = {
            get: vi.fn(draft => draft.title),
            set: vi.fn((draft, value) => {
                draft.title = value;
            }),
        } satisfies ConfigBind<Pick<DemoDraft, 'title'>, string>;

        store.setValue(bind, (title: string) => `${title} net`);

        expect(bind.get).toHaveBeenCalledTimes(1);
        expect(bind.set).toHaveBeenCalledWith({ title: 'Revenue net' }, 'Revenue net');
    });

    it('updates uncontrolled draft fields', () => {
        const handleChange = vi.fn();
        const handleValueChange = vi.fn();

        render(
            <demoConfig.Root defaultValue={defaultDraft} onChange={handleChange}>
                <Field label="Title">
                    <demoConfig.Input
                        bind={titleBind}
                        onValueChange={handleValueChange}
                    />
                </Field>
            </demoConfig.Root>
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Profit' },
        });

        expect(screen.getByLabelText('Title')).toHaveValue('Profit');
        expect(handleValueChange).toHaveBeenCalledWith('Profit');
        expect(getLastCall<DemoDraft>(handleChange).title).toBe('Profit');
    });

    it('reports controlled draft changes without mutating the prop object', () => {
        const handleChange = vi.fn();

        render(
            <demoConfig.Root value={defaultDraft} onChange={handleChange}>
                <Field label="Title">
                    <demoConfig.Input bind={titleBind} />
                </Field>
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
            <demoConfig.Root defaultValue={defaultDraft} onChange={handleChange}>
                <Field label="Column">
                    <demoConfig.Input bind={filterColumnBind} />
                </Field>
                <Field label="Aggregate">
                    <demoConfig.Select
                        bind={measureAggregateBind}
                        options={measureAggregateOptions}
                    />
                </Field>
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

    it('updates flat fields by field names', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
            <demoConfig.Root defaultValue={defaultDraft} onChange={handleChange}>
                <Field label="Title">
                    <demoConfig.Input field="title" />
                </Field>
                <Field label="View mode">
                    <demoConfig.Select field="viewMode">
                        <option value="chart">Chart</option>
                        <option value="table">Table</option>
                    </demoConfig.Select>
                </Field>
                <demoConfig.Section name="Filter" enabledField="filterEnabled">
                    <span>Filter content</span>
                </demoConfig.Section>
            </demoConfig.Root>
        );

        await user.clear(screen.getByLabelText('Title'));
        await user.type(screen.getByLabelText('Title'), 'Profit');
        await user.selectOptions(screen.getByLabelText('View mode'), 'table');
        await user.click(screen.getByRole('switch', { name: 'Filter' }));

        await waitFor(() =>
            expect(
                handleChange.mock.calls.some(call => {
                    const draft = call[0] as DemoDraft;

                    return (
                        draft.title === 'Profit' &&
                        draft.viewMode === 'table' &&
                        draft.filterEnabled === false
                    );
                })
            ).toBe(true)
        );
        await waitFor(() =>
            expect(screen.queryByText('Filter content')).not.toBeInTheDocument()
        );
    });

    it('hides disabled sections and keeps draft values', async () => {
        const user = userEvent.setup();

        render(
            <demoConfig.Root defaultValue={defaultDraft}>
                <demoConfig.Section
                    name="Filter"
                    explain="Restrict rows before aggregation."
                    enabledBind={filterEnabledBind}
                >
                    <Field label="Column">
                        <demoConfig.Input bind={filterColumnBind} />
                    </Field>
                </demoConfig.Section>
            </demoConfig.Root>
        );

        await user.clear(screen.getByLabelText('Column'));
        await user.type(screen.getByLabelText('Column'), 'country');
        await user.click(screen.getByRole('switch', { name: 'Filter' }));

        expect(screen.queryByLabelText('Column')).not.toBeInTheDocument();

        await user.click(screen.getByRole('switch', { name: 'Filter' }));

        expect(screen.getByLabelText('Column')).toHaveValue('country');
        expect(screen.getByLabelText('Explain Filter')).toBeInTheDocument();
    });

    it('supports renderless input and typed hooks', async () => {
        const user = userEvent.setup();

        render(
            <demoConfig.Root defaultValue={defaultDraft}>
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
        expect(screen.getByTestId('hook-view-mode')).toHaveTextContent('chart');

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
            <demoConfig.Root defaultValue={defaultDraft} onSubmit={handleSubmit}>
                <button type="submit">Save</button>
            </demoConfig.Root>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(container.firstElementChild?.tagName).toBe('FORM');
    });
});
