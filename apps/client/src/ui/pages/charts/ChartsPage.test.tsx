import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import type {
    Chart,
    ChartResponse,
    DatasetMetadata as DatasetMetadataFixture,
} from '@qualification-work/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { createChartBuilderDraft } from '@/widgets/ChartBuilder';

import { ChartsPage } from './Charts.page';
import { chartsTestIds } from './const';
import {
    chartsPageInitialState,
    type ChartsPageState,
    type ChartsPreferences,
} from './model';

const mocks = vi.hoisted(() => ({
    savedName: 'Revenue',
    getChartDataQuery: vi.fn(),
    deleteChart: vi.fn(),
    patchChart: vi.fn(),
    refetchCharts: vi.fn(),
    refetchSelectedChart: vi.fn(),
}));

const chart = vi.hoisted(
    () =>
        ({
            id: 'chart-1',
            orgId: 'org-1',
            datasetId: 'dataset-1',
            name: 'Revenue',
            chartType: 'bar',
            config: {
                kind: 'bar',
                dimension: { columnId: 'column-1' },
                measures: [{ aggregate: 'count' }],
            },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies Chart
);

const chartResponse = vi.hoisted(
    () =>
        ({
            kind: 'bar',
            columns: [{ name: 'month', role: 'dim', type: 'string' }],
            rows: [['Jan', 120]],
            truncated: false,
            aggregatedAt: '2026-01-01T00:00:00.000Z',
        }) satisfies ChartResponse
);

const dataset = vi.hoisted(
    () =>
        ({
            dataset: {
                ref: 'dataset:org-1/dataset-1',
                id: 'dataset-1',
                orgId: 'org-1',
                name: 'Invoices',
                sourceType: 'manual',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            columns: [],
            totalRows: 3,
        }) satisfies DatasetMetadata
);

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' } }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: 'owner' },
    }),
}));

vi.mock('@/entities/chart', () => ({
    BAR_CHART_ROWS_LIMIT: 12,
    ChartCard: ({ data }: { data: ChartResponse }) => (
        <div data-testid="chart-result">{data.rows.length} rows</div>
    ),
    ChartShell: ({ data }: { data: ChartResponse }) => (
        <div data-testid="chart-result">{data.rows.length} rows</div>
    ),
    ChartConfigSummary: () => <p data-testid="chart-summary" />,
    getChartColorFromConfig: () => '#8a6cff',
    formatChartCell: (value: unknown) => String(value),
    useGetChartQuery: (chartId: unknown) => ({
        data:
            typeof chartId === 'string' ? { ...chart, name: mocks.savedName } : undefined,
        isLoading: false,
        isError: false,
        refetch: mocks.refetchSelectedChart,
    }),
    useListChartsQuery: () => ({
        data: [chart],
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetchCharts,
    }),
    useGetChartDataQuery: (arg: unknown) => mocks.getChartDataQuery(arg),
    useDeleteChartMutation: () => [mocks.deleteChart, { isLoading: false }],
}));

const datasetMetadataFixtures: DatasetMetadataFixture[] = [dataset];

vi.mock('@/features/buildChart', () => ({
    usePatchChartMutation: () => [mocks.patchChart, { isLoading: false }],
}));

vi.mock('@/widgets/ChartBuilder', () => ({
    configToBuilderDraft: () => ({
        chartType: 'bar',
        dimensionColumnId: 'column-1',
    }),
    createChartBuilderDraft: (overrides = {}) => ({
        chartName: '',
        chartColor: '#8a6cff',
        chartType: 'bar',
        ...overrides,
    }),
    ChartBuilder: ({
        selectedDataset,
        onChartCreated,
        editChartId,
        value,
        onChange,
        onOutputChange,
        onChartUpdated,
    }: {
        selectedDataset: DatasetMetadata;
        editChartId?: string;
        value?: ReturnType<typeof createChartBuilderDraft>;
        onChange?: (draft: ReturnType<typeof createChartBuilderDraft>) => void;
        onOutputChange?: (output: unknown) => void;
        onChartCreated?: (chartId: string) => void;
        onChartUpdated?: (chartId: string) => void;
    }) => {
        const nextDraft = value
            ? { ...value, chartName: 'Unsaved Revenue', chartType: 'line' as const }
            : null;

        return (
            <div data-testid="chart-builder">
                Builder for {selectedDataset.dataset.name}
                <span data-testid="builder-mode">{editChartId ? 'edit' : 'create'}</span>
                <span data-testid="builder-name">{value?.chartName ?? ''}</span>
                <span data-testid="builder-type">{value?.chartType ?? ''}</span>
                <button
                    type="button"
                    onClick={() => {
                        if (!nextDraft) {
                            return;
                        }

                        onChange?.(nextDraft);
                        onOutputChange?.({
                            chartName: nextDraft.chartName,
                            chartColor: nextDraft.chartColor,
                            chartType: nextDraft.chartType,
                            config: null,
                            error: '',
                            canPreview: true,
                        });
                    }}
                >
                    Change builder
                </button>
                <button
                    type="button"
                    onClick={() => onChartUpdated?.(editChartId ?? 'chart-1')}
                >
                    Save edit
                </button>
                <button type="button" onClick={() => onChartCreated?.('chart-new')}>
                    Save chart
                </button>
            </div>
        );
    },
}));

const renderWorkspace = (
    preloadedState: Partial<ChartsPageState & ChartsPreferences>,
    initialRoute = '/charts'
) => {
    const store = createUiTestRuntime({
        datasetMetadata: datasetMetadataFixtures,
        charts: {
            ...chartsPageInitialState,
            ...preloadedState,
        },
    });

    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <ChartsPage />
                </MemoryRouter>
            </Provider>
        ),
    };
};

describe('ChartsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.savedName = 'Revenue';
        mocks.getChartDataQuery.mockImplementation((arg: unknown) => ({
            currentData: typeof arg === 'string' ? chartResponse : undefined,
            isLoading: false,
            isFetching: false,
            error: undefined,
        }));
        mocks.deleteChart.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.patchChart.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(undefined),
        });
        mocks.refetchCharts.mockResolvedValue(undefined);
        mocks.refetchSelectedChart.mockResolvedValue({ data: chart });
    });

    it('syncs the view route to selected chart and loads chart data', async () => {
        const { store } = renderWorkspace({}, '/charts/view?id=chart-1');

        await screen.findByTestId('chart-result');
        expect(store.ui.charts.getState().rememberedChartId).toBe('chart-1');
        expect(mocks.getChartDataQuery).toHaveBeenCalledWith('chart-1');
    });

    it('syncs the edit route and shows the builder with saved config', async () => {
        const { store } = renderWorkspace({}, '/charts/edit?id=chart-1');

        await screen.findByTestId('chart-builder');
        expect(store.ui.charts.getState().rememberedMode).toBe('edit');
        expect(screen.getByTestId('builder-mode')).toHaveTextContent('edit');
        expect(screen.getByTestId('builder-name')).toHaveTextContent('Revenue');
        expect(screen.getByTestId('builder-type')).toHaveTextContent('bar');
        expect(mocks.getChartDataQuery).not.toHaveBeenCalledWith('chart-1');
    });

    it('keeps edit draft when switching view and edit for the same chart', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace({}, '/charts/edit?id=chart-1');

        await user.click(await screen.findByRole('button', { name: 'Change builder' }));
        expect(store.chartEditor.getState().editDraft?.draft.chartName).toBe(
            'Unsaved Revenue'
        );

        await user.click(screen.getByRole('tab', { name: /View/i }));
        await user.click(screen.getByRole('tab', { name: /Edit/i }));

        expect(await screen.findByTestId('builder-name')).toHaveTextContent(
            'Unsaved Revenue'
        );
        expect(screen.getByTestId('builder-type')).toHaveTextContent('line');
    });

    it('clears edit draft after saving edited chart', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace({}, '/charts/edit?id=chart-1');

        await user.click(await screen.findByRole('button', { name: 'Change builder' }));
        await user.click(screen.getByRole('button', { name: 'Save edit' }));

        await waitFor(() => expect(store.chartEditor.getState().editDraft).toBeNull());
        expect(mocks.refetchSelectedChart).toHaveBeenCalled();
    });

    it('selects a dataset from modal and finishes builder creation', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace({}, '/charts/new');

        expect(
            await screen.findByRole('button', { name: /Invoices/ })
        ).toBeInTheDocument();
        expect(store.chartEditor.getState().showDatasetPicker).toBe(true);

        await user.click(screen.getByRole('button', { name: /Invoices/ }));

        expect(store.chartEditor.getState().createDraft?.datasetId ?? null).toBe(
            'dataset-1'
        );
        expect(store.chartEditor.getState().showDatasetPicker).toBe(false);
        expect(screen.getByTestId('chart-builder')).toHaveTextContent('Invoices');

        await user.click(screen.getByRole('button', { name: 'Save chart' }));

        await waitFor(() => expect(mocks.refetchCharts).toHaveBeenCalledTimes(1));
        expect(store.chartEditor.getState().createDraft?.datasetId ?? null).toBeNull();
        expect(store.ui.charts.getState().rememberedChartId).toBe('chart-new');
    });

    it('stores create builder draft while new chart page stays open', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace(
            {
                createDraft: {
                    datasetId: 'dataset-1',
                    draft: createChartBuilderDraft({ chartName: 'Started' }),
                    output: null,
                },
            },
            '/charts/new'
        );

        expect(await screen.findByTestId('builder-name')).toHaveTextContent('Started');

        await user.click(screen.getByRole('button', { name: 'Change builder' }));

        expect(store.chartEditor.getState().createDraft?.draft.chartName).toBe(
            'Unsaved Revenue'
        );
    });

    it('cancels chart creation from the builder header', async () => {
        const user = userEvent.setup();
        const { store } = renderWorkspace({
            createDraft: {
                datasetId: 'dataset-1',
                draft: createChartBuilderDraft(),
                output: null,
            },
        });

        expect(await screen.findByTestId('chart-builder')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Change dataset' })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(store.chartEditor.getState().createDraft?.datasetId ?? null).toBeNull();
        expect(screen.queryByTestId('chart-builder')).not.toBeInTheDocument();
    });

    it('shows chart title above workspace tabs without central rename controls', () => {
        const { container } = renderWorkspace({ rememberedChartId: 'chart-1' });

        expect(
            container.querySelector(`[data-test-id="${chartsTestIds.renameButton}"]`)
        ).toBeNull();
        expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    });
});

it('keeps dirty draft on refetch', async () => {
    const user = userEvent.setup();
    const { store, rerender } = renderWorkspace({}, '/charts/edit?id=chart-1');
    await user.click(await screen.findByRole('button', { name: 'Change builder' }));
    mocks.savedName = 'Updated on server';
    rerender(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/charts/edit?id=chart-1']}>
                <ChartsPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByTestId('builder-name')).toHaveTextContent('Unsaved Revenue');
    expect(store.chartEditor.getState().editDraft?.draft.chartName).toBe(
        'Unsaved Revenue'
    );
});
