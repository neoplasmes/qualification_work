import { useChartsController } from '.';
import type { Chart, ChartData } from '@/core/entities/chart';
import { useRead } from '@/env/cache/useRead';
import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createChartBuilderDraft } from '../../ui/ChartBuilder/model';

const chart: Chart = {
    ref: 'chart:org/chart',
    id: 'chart',
    orgId: 'org',
    datasetId: 'dataset',
    name: 'saved',
    chartType: 'bar',
    config: {
        kind: 'bar',
        dimension: { columnId: 'category' },
        measures: [{ aggregate: 'count' }],
    },
    createdAt: '',
    updatedAt: '',
};
const data: ChartData = {
    kind: 'bar',
    columns: [
        { name: 'category', role: 'dim', type: 'string' },
        { name: 'count', role: 'measure', type: 'number' },
    ],
    rows: [['A', 15]],
    truncated: false,
    aggregatedAt: '',
};
const metadata = {
    dataset: {
        id: 'dataset',
        orgId: 'org',
        name: 'table',
        sourceType: 'manual' as const,
        createdAt: '',
        updatedAt: '',
    },
    columns: [
        {
            id: 'category',
            datasetId: 'dataset',
            key: 'category',
            displayName: 'Category',
            dataType: 'string' as const,
            orderIndex: 0,
            isAnalyzable: true,
        },
    ],
    totalRows: 1,
};

function setup() {
    const store = createUiTestRuntime({ datasetMetadata: [metadata] });
    const deps = store.runtime.dependencies;
    deps.listCharts.execute = async () => [chart];
    deps.getChart.execute = async () => chart;
    deps.getChartData.execute = async () => data;
    const onSaved = vi.fn();
    const props = {
        orgId: 'org',
        chartId: null,
        createDraft: {
            datasetId: 'dataset',
            draft: createChartBuilderDraft(),
            output: null,
        },
        editDraft: null,
        onSaved,
    };
    store.chartEditor.getState().setChartCreateDraft(props.createDraft);
    const wrapper = ({ children }: PropsWithChildren) => (
        <UiTestProvider store={store}>{children}</UiTestProvider>
    );

    return { store, deps, props, wrapper, onSaved };
}

describe('chart controller', () => {
    it('requests preview explicitly and fences stale success and failure after a type change', async () => {
        const { deps, props, wrapper } = setup();
        const requests: {
            signal?: AbortSignal;
            resolve(data: ChartData): void;
            reject(error: Error): void;
        }[] = [];
        deps.previewChartData.execute = (_input, options) =>
            new Promise((resolve, reject) => {
                requests.push({ signal: options?.signal, resolve, reject });
            });
        const { result, rerender } = renderHook(input => useChartsController(input), {
            wrapper,
            initialProps: props,
        });
        await waitFor(() => expect(result.current.builderDataset).not.toBeNull());
        expect(requests).toHaveLength(0);
        let first: Promise<void>;
        act(() => {
            first = result.current.previewChart();
        });
        await waitFor(() => expect(requests).toHaveLength(1));
        rerender({
            ...props,
            createDraft: {
                ...props.createDraft,
                draft: createChartBuilderDraft({ chartType: 'line' }),
            },
        });
        await waitFor(() => expect(requests[0]?.signal?.aborted).toBe(true));
        await act(async () => {
            requests[0]!.resolve(data);
            await first;
        });
        expect(result.current.preview).toBeNull();
        let second: Promise<void>;
        act(() => {
            second = result.current.previewChart();
        });
        await waitFor(() => expect(requests).toHaveLength(2));
        rerender({
            ...props,
            createDraft: {
                ...props.createDraft,
                draft: createChartBuilderDraft({ chartType: 'pie' }),
            },
        });
        await act(async () => {
            requests[1]!.reject(new Error('late preview failure'));
            await second;
        });
        expect(result.current.error).toBe('');
        let latest: Promise<void>;
        act(() => {
            latest = result.current.previewChart();
        });
        await waitFor(() => expect(requests).toHaveLength(3));
        await act(async () => {
            requests[2]!.resolve({ ...data, kind: 'pie' });
            await latest;
        });
        expect(result.current.preview?.data.kind).toBe('pie');
    });

    it('keeps confirmed create distinct from a failed detail refresh', async () => {
        const { deps, props, wrapper, onSaved } = setup();
        const create = vi.fn(async () => ({ id: 'new' }));
        deps.createChart.execute = create;
        deps.getChart.execute = async () => {
            throw new Error('detail unavailable');
        };
        const { result } = renderHook(() => useChartsController(props), { wrapper });
        await waitFor(() => expect(result.current.builderDataset).not.toBeNull());
        await act(async () => {
            await result.current.saveChart(false);
        });
        expect(create).toHaveBeenCalledTimes(1);
        expect(onSaved).toHaveBeenCalledWith('new');
        expect(result.current.error).toBe('');
        expect(result.current.syncError).toContain('Chart saved');
    });

    it('refreshes metadata on rename and chart values only on config changes', async () => {
        const { store, deps, wrapper } = setup();
        let calls = 0;
        deps.getChartData.execute = async () => {
            calls += 1;

            return data;
        };
        deps.patchChart.execute = async () => {};
        const { result } = renderHook(
            () => ({
                detail: useRead(deps.getChart, { orgId: 'org', chartId: 'chart' }),
                data: useRead(deps.getChartData, { orgId: 'org', chartId: 'chart' }),
            }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.data.data).toEqual(data));
        await act(async () => {
            await store.runtime.cache.runCommand(deps.patchChart, {
                orgId: 'org',
                chartId: 'chart',
                name: 'renamed',
            });
        });
        expect(calls).toBe(1);
        await act(async () => {
            await store.runtime.cache.runCommand(deps.patchChart, {
                orgId: 'org',
                chartId: 'chart',
                config: chart.config,
            });
        });
        expect(calls).toBe(2);
    });
});

it('serializes writes to one chart while allowing another chart to proceed', async () => {
    const { store, deps } = setup();
    const started: string[] = [];
    let release = () => {};
    const firstWrite = new Promise<void>(resolve => {
        release = resolve;
    });
    deps.updateChart.execute = async input => {
        started.push(`update:${input.chartId}`);
        if (input.chartId === 'chart') {
            await firstWrite;
        }
    };
    deps.patchChart.execute = async input => {
        started.push(`patch:${input.chartId}`);
    };
    const first = store.runtime.cache.runCommand(deps.updateChart, {
        orgId: 'org',
        chartId: 'chart',
        config: chart.config,
    });
    await waitFor(() => expect(started).toEqual(['update:chart']));
    const same = store.runtime.cache.runCommand(deps.patchChart, {
        orgId: 'org',
        chartId: 'chart',
        name: 'next name',
    });
    const other = store.runtime.cache.runCommand(deps.updateChart, {
        orgId: 'org',
        chartId: 'other',
        config: chart.config,
    });
    try {
        await waitFor(() => expect(started).toEqual(['update:chart', 'update:other']));
    } finally {
        release();
        await Promise.all([first, same, other]);
    }
    expect(started).toEqual(['update:chart', 'update:other', 'patch:chart']);
});

it('fences color changes but retains a preview across name-only edits', async () => {
    const { deps, props, wrapper } = setup();
    const response = deferred<ChartData>();
    deps.previewChartData.execute = () => response.promise;
    const { result, rerender } = renderHook(input => useChartsController(input), {
        wrapper,
        initialProps: props,
    });
    await waitFor(() => expect(result.current.builderDataset).not.toBeNull());
    let preview!: Promise<void>;
    act(() => {
        preview = result.current.previewChart();
    });
    rerender({
        ...props,
        createDraft: {
            ...props.createDraft,
            draft: { ...props.createDraft.draft, chartColor: '#123456' },
        },
    });
    await act(async () => {
        response.resolve(data);
        await preview;
    });
    expect(result.current.preview).toBeNull();
    await act(async () => {
        await result.current.previewChart();
    });
    const accepted = result.current.preview;
    rerender({
        ...props,
        createDraft: {
            ...props.createDraft,
            draft: {
                ...props.createDraft.draft,
                chartColor: '#123456',
                chartName: 'renamed only',
            },
        },
    });
    expect(result.current.preview).toBe(accepted);
});
