import { useCallback, useEffect, useRef, useState } from 'react';

import {
    DEFAULT_CHART_COLOR,
    type ChartType,
    type FilterOperation,
} from '@/entities/chart';

import type { Aggregate, MeasureValueFormat, TimeGranularity } from '../api';
import type { GroupingMode } from '../types';

const chartResultLimit = 24;

export const MAX_MEASURES = 6;

export type MeasureField = {
    aggregate: Aggregate;
    valueFormat: MeasureValueFormat;
    columnId: string;
};

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
    measures: MeasureField[];
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

const createMeasure = (overrides?: Partial<MeasureField>): MeasureField => ({
    aggregate: 'count',
    valueFormat: '',
    columnId: '',
    ...overrides,
});

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
    measures: [createMeasure()],
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
    measures: (initialOverrides?.measures ?? defaultFields.measures).map(measure => ({
        ...measure,
    })),
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
    setMeasureAggregate(index: number, v: Aggregate): void;
    setMeasureValueFormat(index: number, v: MeasureValueFormat): void;
    setMeasureColumnId(index: number, v: string): void;
    addMeasure(): void;
    removeMeasure(index: number): void;
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
        setMeasureAggregate: useCallback(
            (index: number, v: Aggregate) =>
                patch({
                    measures: fields.measures.map((measure, i) =>
                        i === index ? { ...measure, aggregate: v } : measure
                    ),
                }),
            [fields.measures, patch]
        ),
        setMeasureValueFormat: useCallback(
            (index: number, v: MeasureValueFormat) =>
                patch({
                    measures: fields.measures.map((measure, i) =>
                        i === index ? { ...measure, valueFormat: v } : measure
                    ),
                }),
            [fields.measures, patch]
        ),
        setMeasureColumnId: useCallback(
            (index: number, v: string) =>
                patch({
                    measures: fields.measures.map((measure, i) =>
                        i === index ? { ...measure, columnId: v } : measure
                    ),
                }),
            [fields.measures, patch]
        ),
        addMeasure: useCallback(
            () =>
                patch({
                    measures:
                        fields.measures.length >= MAX_MEASURES
                            ? fields.measures
                            : [...fields.measures, createMeasure({ aggregate: 'avg' })],
                }),
            [fields.measures, patch]
        ),
        removeMeasure: useCallback(
            (index: number) =>
                patch({
                    measures:
                        fields.measures.length <= 1
                            ? fields.measures
                            : fields.measures.filter((_, i) => i !== index),
                }),
            [fields.measures, patch]
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
