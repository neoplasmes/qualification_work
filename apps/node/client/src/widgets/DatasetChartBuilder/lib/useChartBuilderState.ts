import { useCallback, useEffect, useRef, useState } from 'react';

import type { Aggregate, FilterOperation, ChartType, TimeGranularity } from '@/features/charts';

type GroupingMode = 'none' | 'time' | 'numeric';

const CHART_RESULT_LIMIT = 24;

export type ChartBuilderFields = {
    chartName: string;
    chartType: ChartType;
    dimensionColumnId: string;
    dimensionGroupingMode: GroupingMode;
    dimensionGranularity: TimeGranularity;
    dimensionStep: number;
    heatmapYColumnId: string;
    heatmapYGroupingMode: GroupingMode;
    heatmapYGranularity: TimeGranularity;
    heatmapYStep: number;
    aggregate: Aggregate;
    measureColumnId: string;
    secondMeasureEnabled: boolean;
    secondAggregate: Aggregate;
    secondMeasureColumnId: string;
    limit: number;
    topN: number;
    sortDirection: 'asc' | 'desc';
    seriesEnabled: boolean;
    seriesColumnId: string;
    seriesTopN: number;
    seriesOtherBucket: boolean;
    filterEnabled: boolean;
    filterColumnId: string;
    filterOperation: FilterOperation;
    filterValue: string;
};

const defaultFields = ((): ChartBuilderFields => ({
    chartName: '',
    chartType: 'bar',
    dimensionColumnId: '',
    dimensionGroupingMode: 'none',
    dimensionGranularity: 'month',
    dimensionStep: 10,
    heatmapYColumnId: '',
    heatmapYGroupingMode: 'none',
    heatmapYGranularity: 'month',
    heatmapYStep: 10,
    aggregate: 'count',
    measureColumnId: '',
    secondMeasureEnabled: false,
    secondAggregate: 'avg',
    secondMeasureColumnId: '',
    limit: CHART_RESULT_LIMIT,
    topN: 12,
    sortDirection: 'desc',
    seriesEnabled: false,
    seriesColumnId: '',
    seriesTopN: 8,
    seriesOtherBucket: true,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
}))();

const lsKey = (datasetId: string) => `chartBuilder_${datasetId}`;

const loadFields = (datasetId: string): ChartBuilderFields => {
    try {
        const raw = localStorage.getItem(lsKey(datasetId));
        if (!raw) {return { ...defaultFields };}
        return { ...defaultFields, ...(JSON.parse(raw) as Partial<ChartBuilderFields>) };
    } catch {
        return { ...defaultFields };
    }
};

type Setters = {
    setChartName(v: string): void;
    setChartType(v: ChartType): void;
    setDimensionColumnId(v: string): void;
    setDimensionGroupingMode(v: GroupingMode): void;
    setDimensionGranularity(v: TimeGranularity): void;
    setDimensionStep(v: number): void;
    setHeatmapYColumnId(v: string): void;
    setHeatmapYGroupingMode(v: GroupingMode): void;
    setHeatmapYGranularity(v: TimeGranularity): void;
    setHeatmapYStep(v: number): void;
    setAggregate(v: Aggregate): void;
    setMeasureColumnId(v: string): void;
    setSecondMeasureEnabled(v: boolean): void;
    setSecondAggregate(v: Aggregate): void;
    setSecondMeasureColumnId(v: string): void;
    setLimit(v: number): void;
    setTopN(v: number): void;
    setSortDirection(v: 'asc' | 'desc'): void;
    setSeriesEnabled(v: boolean): void;
    setSeriesColumnId(v: string): void;
    setSeriesTopN(v: number): void;
    setSeriesOtherBucket(v: boolean): void;
    setFilterEnabled(v: boolean): void;
    setFilterColumnId(v: string): void;
    setFilterOperation(v: FilterOperation): void;
    setFilterValue(v: string): void;
};

export const useChartBuilderState = (datasetId: string): ChartBuilderFields & Setters => {
    const [fields, setFields] = useState<ChartBuilderFields>(() => loadFields(datasetId));
    const prevDatasetId = useRef(datasetId);
    const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // reset when a different dataset is picked
    useEffect(() => {
        if (prevDatasetId.current === datasetId) {return;}
        prevDatasetId.current = datasetId;
        setFields(loadFields(datasetId));
    }, [datasetId]);

    const patch = useCallback(
        (partial: Partial<ChartBuilderFields>) => {
            setFields(prev => {
                const next = { ...prev, ...partial };
                if (writeTimer.current !== null) {clearTimeout(writeTimer.current);}
                writeTimer.current = setTimeout(() => {
                    try {
                        localStorage.setItem(lsKey(datasetId), JSON.stringify(next));
                    } catch {
                        // ignore quota errors
                    }
                }, 300);

                return next;
            });
        },
        [datasetId]
    );

    return {
        ...fields,
        setChartName: useCallback((v: string) => patch({ chartName: v }), [patch]),
        setChartType: useCallback((v: ChartType) => patch({ chartType: v }), [patch]),
        setDimensionColumnId: useCallback(
            (v: string) => patch({ dimensionColumnId: v }),
            [patch]
        ),
        setDimensionGroupingMode: useCallback(
            (v: GroupingMode) => patch({ dimensionGroupingMode: v }),
            [patch]
        ),
        setDimensionGranularity: useCallback(
            (v: TimeGranularity) => patch({ dimensionGranularity: v }),
            [patch]
        ),
        setDimensionStep: useCallback((v: number) => patch({ dimensionStep: v }), [patch]),
        setHeatmapYColumnId: useCallback(
            (v: string) => patch({ heatmapYColumnId: v }),
            [patch]
        ),
        setHeatmapYGroupingMode: useCallback(
            (v: GroupingMode) => patch({ heatmapYGroupingMode: v }),
            [patch]
        ),
        setHeatmapYGranularity: useCallback(
            (v: TimeGranularity) => patch({ heatmapYGranularity: v }),
            [patch]
        ),
        setHeatmapYStep: useCallback((v: number) => patch({ heatmapYStep: v }), [patch]),
        setAggregate: useCallback((v: Aggregate) => patch({ aggregate: v }), [patch]),
        setMeasureColumnId: useCallback(
            (v: string) => patch({ measureColumnId: v }),
            [patch]
        ),
        setSecondMeasureEnabled: useCallback(
            (v: boolean) => patch({ secondMeasureEnabled: v }),
            [patch]
        ),
        setSecondAggregate: useCallback(
            (v: Aggregate) => patch({ secondAggregate: v }),
            [patch]
        ),
        setSecondMeasureColumnId: useCallback(
            (v: string) => patch({ secondMeasureColumnId: v }),
            [patch]
        ),
        setLimit: useCallback((v: number) => patch({ limit: v }), [patch]),
        setTopN: useCallback((v: number) => patch({ topN: v }), [patch]),
        setSortDirection: useCallback(
            (v: 'asc' | 'desc') => patch({ sortDirection: v }),
            [patch]
        ),
        setSeriesEnabled: useCallback(
            (v: boolean) => patch({ seriesEnabled: v }),
            [patch]
        ),
        setSeriesColumnId: useCallback(
            (v: string) => patch({ seriesColumnId: v }),
            [patch]
        ),
        setSeriesTopN: useCallback((v: number) => patch({ seriesTopN: v }), [patch]),
        setSeriesOtherBucket: useCallback(
            (v: boolean) => patch({ seriesOtherBucket: v }),
            [patch]
        ),
        setFilterEnabled: useCallback(
            (v: boolean) => patch({ filterEnabled: v }),
            [patch]
        ),
        setFilterColumnId: useCallback(
            (v: string) => patch({ filterColumnId: v }),
            [patch]
        ),
        setFilterOperation: useCallback(
            (v: FilterOperation) => patch({ filterOperation: v }),
            [patch]
        ),
        setFilterValue: useCallback((v: string) => patch({ filterValue: v }), [patch]),
    };
};
