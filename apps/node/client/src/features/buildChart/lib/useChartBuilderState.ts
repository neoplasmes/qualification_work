import { useCallback, useEffect, useRef, useState } from 'react';

import {
    DEFAULT_CHART_COLOR,
    type ChartType,
    type FilterOperation,
} from '@/entities/chart';

import type { Aggregate, MeasureValueFormat, TimeGranularity } from '../api';
import type { GroupingMode } from '../types';

const chartResultLimit = 24;

export type ChartBuilderFields = {
    chartName: string;
    chartColor: string;
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
    valueFormat: MeasureValueFormat;
    measureColumnId: string;
    secondMeasureEnabled: boolean;
    secondAggregate: Aggregate;
    secondValueFormat: MeasureValueFormat;
    secondMeasureColumnId: string;
    limit: number;
    topN: number;
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
    chartColor: DEFAULT_CHART_COLOR,
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
    valueFormat: 'number',
    measureColumnId: '',
    secondMeasureEnabled: false,
    secondAggregate: 'avg',
    secondValueFormat: 'number',
    secondMeasureColumnId: '',
    limit: chartResultLimit,
    topN: 12,
    seriesEnabled: false,
    seriesColumnId: '',
    seriesTopN: 8,
    seriesOtherBucket: true,
    filterEnabled: false,
    filterColumnId: '',
    filterOperation: 'eq',
    filterValue: '',
}))();

export const createChartBuilderFields = (
    initialOverrides?: Partial<ChartBuilderFields>
): ChartBuilderFields => ({
    ...defaultFields,
    ...initialOverrides,
});

export type ChartBuilderSetters = {
    setChartName(v: string): void;
    setChartColor(v: string): void;
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
    setValueFormat(v: MeasureValueFormat): void;
    setMeasureColumnId(v: string): void;
    setSecondMeasureEnabled(v: boolean): void;
    setSecondAggregate(v: Aggregate): void;
    setSecondValueFormat(v: MeasureValueFormat): void;
    setSecondMeasureColumnId(v: string): void;
    setLimit(v: number): void;
    setTopN(v: number): void;
    setSeriesEnabled(v: boolean): void;
    setSeriesColumnId(v: string): void;
    setSeriesTopN(v: number): void;
    setSeriesOtherBucket(v: boolean): void;
    setFilterEnabled(v: boolean): void;
    setFilterColumnId(v: string): void;
    setFilterOperation(v: FilterOperation): void;
    setFilterValue(v: string): void;
};

type UseChartBuilderStateParams = {
    datasetId: string;
    initialOverrides?: Partial<ChartBuilderFields>;
    value?: ChartBuilderFields;
    onChange?: (fields: ChartBuilderFields) => void;
};

export const useChartBuilderState = ({
    datasetId,
    initialOverrides,
    value,
    onChange,
}: UseChartBuilderStateParams): ChartBuilderFields & ChartBuilderSetters => {
    const [localFields, setLocalFields] = useState<ChartBuilderFields>(() =>
        createChartBuilderFields(initialOverrides)
    );
    const prevDatasetId = useRef(datasetId);
    const controlled = value !== undefined;
    const fields = value ?? localFields;

    useEffect(() => {
        if (prevDatasetId.current === datasetId) {
            return;
        }

        prevDatasetId.current = datasetId;
        setLocalFields(createChartBuilderFields(initialOverrides));
    }, [datasetId, initialOverrides]);

    const patch = useCallback(
        (partial: Partial<ChartBuilderFields>) => {
            const next = { ...fields, ...partial };

            if (controlled) {
                onChange?.(next);
            } else {
                setLocalFields(next);
            }
        },
        [controlled, fields, onChange]
    );

    return {
        ...fields,
        setChartName: useCallback((v: string) => patch({ chartName: v }), [patch]),
        setChartColor: useCallback((v: string) => patch({ chartColor: v }), [patch]),
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
        setDimensionStep: useCallback(
            (v: number) => patch({ dimensionStep: v }),
            [patch]
        ),
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
        setValueFormat: useCallback(
            (v: MeasureValueFormat) => patch({ valueFormat: v }),
            [patch]
        ),
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
        setSecondValueFormat: useCallback(
            (v: MeasureValueFormat) => patch({ secondValueFormat: v }),
            [patch]
        ),
        setSecondMeasureColumnId: useCallback(
            (v: string) => patch({ secondMeasureColumnId: v }),
            [patch]
        ),
        setLimit: useCallback((v: number) => patch({ limit: v }), [patch]),
        setTopN: useCallback((v: number) => patch({ topN: v }), [patch]),
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
