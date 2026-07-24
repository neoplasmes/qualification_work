import { useChartsController } from '.';
import type { Chart } from '@/core/entities/chart';
import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';
import { useStore } from 'zustand';

import { createChartBuilderDraft } from '../../ui/ChartBuilder/model';

const chart: Chart = {
    ref: 'chart:org/saved',
    id: 'saved',
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

function setup() {
    const store = createUiTestRuntime({
        datasetMetadata: [
            {
                dataset: {
                    id: 'dataset',
                    orgId: 'org',
                    name: 'dataset',
                    sourceType: 'manual',
                    createdAt: '',
                    updatedAt: '',
                },
                columns: [
                    {
                        id: 'category',
                        datasetId: 'dataset',
                        key: 'category',
                        displayName: 'Category',
                        dataType: 'string',
                        orderIndex: 0,
                        isAnalyzable: true,
                    },
                ],
                totalRows: 1,
            },
        ],
    });
    store.chartEditor.getState().setChartCreateDraft({
        datasetId: 'dataset',
        draft: createChartBuilderDraft({ chartName: 'submitted' }),
        output: null,
    });
    const receipt = deferred<{ id: string }>();
    const detail = deferred<Chart>();
    const deps = store.runtime.dependencies;
    deps.listCharts.execute = async () => [];
    const create = vi.fn(() => receipt.promise);
    const read = vi.fn(() => detail.promise);
    deps.createChart.execute = create;
    deps.getChart.execute = read;
    const onSaved = vi.fn();
    const wrapper = ({ children }: PropsWithChildren) => (
        <UiTestProvider store={store}>{children}</UiTestProvider>
    );
    const useController = () =>
        useChartsController({
            orgId: 'org',
            chartId: null,
            createDraft: useStore(store.chartEditor, state => state.createDraft),
            editDraft: null,
            onSaved,
        });

    return { store, receipt, detail, create, read, onSaved, wrapper, useController };
}

it('guards repeated create while acknowledged detail remains pending', async () => {
    const fixture = setup();
    const { result } = renderHook(fixture.useController, { wrapper: fixture.wrapper });
    await waitFor(() => expect(result.current.builderDataset).not.toBeNull());
    let first!: Promise<void>;
    act(() => {
        first = result.current.saveChart(false);
    });
    await waitFor(() => expect(fixture.create).toHaveBeenCalledTimes(1));
    await act(async () => {
        fixture.receipt.resolve({ id: 'saved' });
    });
    await waitFor(() => expect(fixture.read).toHaveBeenCalledTimes(1));
    expect(result.current.isSaving).toBe(true);
    act(() => {
        fixture.store.chartEditor.getState().setChartCreateOutput({
            chartType: 'bar',
            chartName: 'derived',
            chartColor: '#123456',
            config: chart.config,
            error: '',
            canPreview: true,
        });
        const draft = fixture.store.chartEditor.getState().createDraft!.draft;
        fixture.store.chartEditor
            .getState()
            .setChartCreateDraftValue({ ...draft, chartName: 'blocked while saving' });
        fixture.store.chartEditor.getState().changeDataset('blocked dataset');
    });
    expect(fixture.store.chartEditor.getState().createDraft?.draft.chartName).toBe(
        'submitted'
    );
    expect(fixture.store.chartEditor.getState().createDraft?.datasetId).toBe('dataset');
    let repeated!: Promise<void>;
    act(() => {
        repeated = result.current.saveChart(false);
    });
    await act(async () => {
        fixture.detail.resolve(chart);
        await Promise.all([first, repeated]);
    });
    expect(fixture.create).toHaveBeenCalledTimes(1);
});

it.each(['receipt', 'detail'])(
    'reconciles create after unmount during %s and guards remount',
    async stage => {
        const fixture = setup();
        const first = renderHook(fixture.useController, { wrapper: fixture.wrapper });
        await waitFor(() => expect(first.result.current.builderDataset).not.toBeNull());
        let saving!: Promise<void>;
        act(() => {
            saving = first.result.current.saveChart(false);
        });
        await waitFor(() => expect(fixture.create).toHaveBeenCalledTimes(1));
        if (stage === 'detail') {
            await act(async () => {
                fixture.receipt.resolve({ id: 'saved' });
            });
            await waitFor(() => expect(fixture.read).toHaveBeenCalledTimes(1));
        }
        first.unmount();
        const second = renderHook(fixture.useController, { wrapper: fixture.wrapper });
        await waitFor(() => expect(second.result.current.builderDataset).not.toBeNull());
        expect(second.result.current.isSaving).toBe(true);
        let repeated!: Promise<void>;
        act(() => {
            repeated = second.result.current.saveChart(false);
        });
        await act(async () => {
            fixture.receipt.resolve({ id: 'saved' });
            fixture.detail.resolve(chart);
            await Promise.all([saving, repeated]);
        });
        expect(fixture.create).toHaveBeenCalledTimes(1);
        expect(fixture.store.chartEditor.getState().createDraft).toBeNull();
        expect(fixture.onSaved).not.toHaveBeenCalled();
    }
);

it.each(['new draft', 'session reset'])(
    'does not reconcile an old receipt into a %s',
    async replacement => {
        const fixture = setup();
        const first = renderHook(fixture.useController, { wrapper: fixture.wrapper });
        await waitFor(() => expect(first.result.current.builderDataset).not.toBeNull());
        let saving!: Promise<void>;
        act(() => {
            saving = first.result.current.saveChart(false);
        });
        await waitFor(() => expect(fixture.create).toHaveBeenCalledTimes(1));
        act(() => {
            if (replacement === 'session reset') {
                fixture.store.chartEditor.setState(
                    fixture.store.chartEditor.getInitialState(),
                    true
                );
            } else {
                fixture.store.chartEditor.getState().clearChartCreateDraft();
            }
            fixture.store.chartEditor.getState().setChartCreateDraft({
                datasetId: 'dataset',
                draft: createChartBuilderDraft({ chartName: 'newer draft' }),
                output: null,
            });
        });
        await act(async () => {
            fixture.receipt.resolve({ id: 'saved' });
            fixture.detail.resolve(chart);
            await saving;
        });
        expect(fixture.store.chartEditor.getState().createDraft?.draft.chartName).toBe(
            'newer draft'
        );
        expect(fixture.onSaved).not.toHaveBeenCalled();
    }
);
