import type { ChartConfig, ChartData } from '@/core/entities/chart';
import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';

import {
    configToBuilderDraft,
    createChartBuilderDraft,
    createChartBuilderOutput,
} from '../../ui/ChartBuilder/model';
import type { ChartsCreateDraft, ChartsEditDraft } from '../chartDraft';
import { chartsEditorContext } from '../editorOwner';

export type ChartPreview = { config: ChartConfig; data: ChartData } | null;

export function useChartsController({
    orgId,
    chartId,
    createDraft,
    editDraft,
    onSaved,
}: {
    orgId: string;
    chartId: string | null;
    createDraft: ChartsCreateDraft | null;
    editDraft: ChartsEditDraft | null;
    onSaved(chartId: string): void;
}) {
    const dependencies = useDependencies();
    const editor = useContext(chartsEditorContext);
    if (!editor) {
        throw new Error('Charts editor owner is required');
    }
    const createPending = useStore(editor, state =>
        Boolean(state.createSave?.pending && state.createSave.orgId === orgId)
    );
    const [updating, setUpdating] = useState(false);
    const updatePending = useRef(false);
    const scope = useRef({ orgId, chartId });
    scope.current = { orgId, chartId };
    const charts = useRead(
        dependencies.listCharts,
        { orgId },
        { enabled: Boolean(orgId) }
    );
    const selected = useRead(
        dependencies.getChart,
        { orgId, chartId: chartId ?? '' },
        { enabled: Boolean(orgId && chartId) }
    );
    const datasets = useRead(
        dependencies.listDatasets,
        { orgId },
        { enabled: Boolean(orgId) }
    );
    const builderDataset =
        datasets.data?.find(item => item.dataset.id === createDraft?.datasetId) ?? null;
    const editDataset =
        datasets.data?.find(item => item.dataset.id === selected.data?.datasetId) ?? null;
    const dataset = builderDataset ?? editDataset;
    const savedDraft = useMemo(
        () =>
            selected.data
                ? createChartBuilderDraft({
                      ...configToBuilderDraft(
                          selected.data.config,
                          selected.data.chartType
                      ),
                      chartName: selected.data.name,
                  })
                : null,
        [selected.data]
    );
    const draft =
        createDraft?.draft ??
        (editDraft?.chartId === chartId ? editDraft?.draft : savedDraft) ??
        null;
    const create = useCommand(dependencies.createChart);
    const update = useCommand(dependencies.updateChart);
    const [preview, setPreview] = useState<ChartPreview>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [error, setError] = useState('');
    const [syncError, setSyncError] = useState('');
    const request = useRef<AbortController | null>(null);
    const mounted = useRef(true);
    const datasetId = dataset?.dataset.id;
    const output = useMemo(
        () =>
            draft && dataset
                ? createChartBuilderOutput(draft, dataset.columns, Boolean(chartId))
                : null,
        [draft, dataset, chartId]
    );

    useEffect(() => {
        request.current?.abort();
        request.current = null;
        setPreview(null);
        setPreviewLoading(false);
        setError('');
    }, [
        orgId,
        datasetId,
        draft?.chartType,
        draft?.chartDraft,
        draft?.chartColor,
        chartId,
    ]);
    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            request.current?.abort();
        };
    }, []);

    return {
        charts,
        selected,
        datasets,
        builderDataset,
        editDataset,
        draft,
        preview,
        previewLoading,
        error,
        syncError,
        isSaving: createPending || updating,
        async previewChart() {
            if (!output?.config || !datasetId) {
                setError(output?.error ?? 'Сначала выберите таблицу.');

                return;
            }
            request.current?.abort();
            const controller = new AbortController();
            request.current = controller;
            setPreviewLoading(true);
            setError('');
            const config = output.config;
            try {
                const data = await dependencies.cache.read(
                    dependencies.previewChartData,
                    { orgId, datasetId, chartType: output.chartType, config },
                    { signal: controller.signal }
                );
                if (
                    !controller.signal.aborted &&
                    request.current === controller &&
                    mounted.current
                ) {
                    setPreview({ config, data });
                }
            } catch (cause) {
                if (
                    !controller.signal.aborted &&
                    request.current === controller &&
                    mounted.current
                ) {
                    setError(
                        getApiErrorMessage(cause, 'Не удалось построить предпросмотр.')
                    );
                }
            } finally {
                if (request.current === controller && mounted.current) {
                    setPreviewLoading(false);
                }
            }
        },
        backToConfig() {
            request.current?.abort();
            request.current = null;
            setPreview(null);
            setPreviewLoading(false);
            setError('');
        },
        async saveChart(usePreview: boolean) {
            const config = usePreview ? preview?.config : output?.config;
            if (!config || !output || !dataset) {
                setError(output?.error ?? 'Сначала выберите таблицу.');

                return;
            }
            if (updatePending.current) {
                return;
            }
            const createId = chartId ? null : editor.getState().beginCreateSave(orgId);
            if (!chartId && !createId) {
                return;
            }
            if (chartId) {
                updatePending.current = true;
                setUpdating(true);
            }
            setError('');
            setSyncError('');
            const name =
                output.chartName.trim() || `${dataset.dataset.name} ${output.chartType}`;
            let savedId: string;
            let refreshError: unknown;
            try {
                if (chartId) {
                    const outcome = await update.executeOutcome({
                        orgId,
                        chartId,
                        name,
                        chartType: output.chartType,
                        config,
                    });
                    savedId = chartId;
                    refreshError = outcome.syncError;
                } else {
                    const outcome = await create.executeOutcome({
                        orgId,
                        datasetId: dataset.dataset.id,
                        name,
                        chartType: output.chartType,
                        config,
                    });
                    savedId = outcome.data.id;
                    refreshError = outcome.syncError;
                    if (!editor.getState().acknowledgeCreate(createId!, savedId)) {
                        return;
                    }
                }
            } catch (cause) {
                const current =
                    !createId || editor.getState().createSave?.id === createId;
                if (createId) {
                    editor.getState().finishCreateSave(createId);
                }
                updatePending.current = false;
                if (mounted.current) {
                    setUpdating(false);
                }
                if (
                    current &&
                    mounted.current &&
                    scope.current.orgId === orgId &&
                    scope.current.chartId === chartId
                ) {
                    setError(getApiErrorMessage(cause, 'Не удалось сохранить график.'));
                }

                return;
            }
            try {
                await dependencies.cache.read(dependencies.getChart, {
                    orgId,
                    chartId: savedId,
                });
            } catch (cause) {
                refreshError = cause;
            }
            const accepted = createId
                ? editor.getState().finishCreateSave(createId)
                : true;
            updatePending.current = false;
            if (mounted.current) {
                setUpdating(false);
            }
            if (
                !accepted ||
                !mounted.current ||
                scope.current.orgId !== orgId ||
                scope.current.chartId !== chartId
            ) {
                return;
            }
            setPreview(null);
            if (refreshError) {
                setSyncError(
                    'График сохранён, но обновить данные не удалось. Перезагрузите страницу.'
                );
            }
            onSaved(savedId);
        },
    };
}
