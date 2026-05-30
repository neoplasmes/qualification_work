import { PencilLine, Play, Save } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import {
    AGGREGATE_LABELS,
    ChartConfigSummary,
    ChartResult,
    FILTER_OP_LABELS,
    getChartColorFromConfig,
    GRANULARITY_LABELS,
    normalizeChartColor,
    VALUE_FORMAT_LABELS,
    type ChartConfig,
    type ChartResponse,
    type ChartType,
    type FilterClause,
    type FilterOperation,
} from '@/entities/chart';
import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { useHasOverflow } from '@/shared/lib/useHasOverflow';
import { Button, Select, Separator, StatusMessage, Switch, TextInput } from '@/shared/ui';

import {
    useCreateChartMutation,
    usePreviewChartDataMutation,
    useUpdateChartMutation,
    type Aggregate,
    type AxisGrouping,
    type MeasureValueFormat,
    type TimeGranularity,
} from '../api';
import {
    useChartBuilderState,
    type ChartBuilderFields,
} from '../lib/useChartBuilderState';
import { AnalysisColumnOptions, ColorPickerControl } from './components';
import {
    getActiveAnalysisColumnId,
    isAnalysisColumnEnabled,
} from './components/AnalysisColumnOptions/lib';

import styles from './DatasetChartBuilder.module.scss';

const chartTypes = ['bar', 'line', 'pie', 'heatmap'] as const;
const aggregates = ['count', 'sum', 'avg', 'min', 'max', 'count_distinct'] as const;
const valueFormats = ['number', 'rub', 'usd', 'percent'] as const;
const filterOperations = [
    'eq',
    'neq',
    'in',
    'nin',
    'gt',
    'gte',
    'lt',
    'lte',
    'between',
    'is_null',
    'not_null',
] as const;
const timeGranularities = ['day', 'week', 'month', 'quarter', 'year'] as const;
const CHART_ROW_LIMIT = 200;

const CHART_TYPE_LABELS: Record<ChartType, string> = {
    bar: 'Bar',
    line: 'Line',
    pie: 'Pie',
    heatmap: 'Heatmap',
};

const GROUPING_LABELS: Record<GroupingMode, string> = {
    none: 'None',
    time: 'By time',
    numeric: 'By range',
};

type GroupingMode = 'none' | 'time' | 'numeric';

const parsePrimitiveValue = (rawValue: string, dataType: DatasetColumn['dataType']) => {
    const value = rawValue.trim();

    if (dataType === 'number') {
        return Number(value);
    }

    if (dataType === 'bool') {
        return value.toLowerCase() === 'true';
    }

    return value;
};

const buildGrouping = (
    mode: GroupingMode,
    granularity: TimeGranularity,
    step: number
): AxisGrouping | undefined => {
    if (mode === 'time') {
        return { kind: 'time', granularity };
    }

    if (mode === 'numeric') {
        return { kind: 'numeric', step };
    }

    return undefined;
};

const buildMeasure = (
    aggregate: Aggregate,
    measureColumnId: string,
    valueFormat: MeasureValueFormat,
    alias?: string
) =>
    aggregate === 'count'
        ? { aggregate, valueFormat, ...(alias ? { alias } : {}) }
        : {
              aggregate,
              columnId: measureColumnId,
              valueFormat,
              ...(alias ? { alias } : {}),
          };

const buildFilter = (
    column: DatasetColumn,
    operation: FilterOperation,
    rawValue: string
): FilterClause => {
    if (operation === 'is_null' || operation === 'not_null') {
        return { columnId: column.id, op: operation };
    }

    if (operation === 'between') {
        const parts = rawValue
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);

        return {
            columnId: column.id,
            op: operation,
            value: parts
                .slice(0, 2)
                .map(part => parsePrimitiveValue(part, column.dataType)),
        };
    }

    if (operation === 'in' || operation === 'nin') {
        return {
            columnId: column.id,
            op: operation,
            value: rawValue
                .split(',')
                .map(part => part.trim())
                .filter(Boolean)
                .map(part => parsePrimitiveValue(part, column.dataType)),
        };
    }

    return {
        columnId: column.id,
        op: operation,
        value: parsePrimitiveValue(rawValue, column.dataType),
    };
};

type BuildChartConfigInput = {
    chartType: ChartType;
    chartColor: string;
    dimensionColumnId: string;
    dimensionGrouping: AxisGrouping | undefined;
    heatmapYColumnId: string;
    heatmapYGrouping: AxisGrouping | undefined;
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
    filter: FilterClause | null;
};

const buildChartConfig = ({
    chartType,
    chartColor,
    dimensionColumnId,
    dimensionGrouping,
    heatmapYColumnId,
    heatmapYGrouping,
    aggregate,
    valueFormat,
    measureColumnId,
    secondMeasureEnabled,
    secondAggregate,
    secondValueFormat,
    secondMeasureColumnId,
    limit,
    topN,
    seriesEnabled,
    seriesColumnId,
    seriesTopN,
    seriesOtherBucket,
    filter,
}: BuildChartConfigInput): ChartConfig => {
    const firstMeasure = buildMeasure(aggregate, measureColumnId, valueFormat);
    const base = {
        limit,
        style: { color: normalizeChartColor(chartColor) },
        ...(filter ? { filters: [filter] } : {}),
    };

    if (chartType === 'pie') {
        return {
            ...base,
            kind: 'pie',
            slice: { columnId: dimensionColumnId, topN, otherBucket: true },
            measure: firstMeasure,
        };
    }

    if (chartType === 'heatmap') {
        return {
            ...base,
            kind: 'heatmap',
            x: {
                columnId: dimensionColumnId,
                ...(dimensionGrouping ? { grouping: dimensionGrouping } : {}),
            },
            y: {
                columnId: heatmapYColumnId,
                ...(heatmapYGrouping ? { grouping: heatmapYGrouping } : {}),
            },
            measure: firstMeasure,
        };
    }

    const measures = [
        firstMeasure,
        ...(secondMeasureEnabled
            ? [
                  buildMeasure(
                      secondAggregate,
                      secondMeasureColumnId,
                      secondValueFormat,
                      'm1'
                  ),
              ]
            : []),
    ];

    return {
        ...base,
        kind: chartType,
        orderBy: { ref: 'dim', index: 0, dir: 'asc' },
        dimension: {
            columnId: dimensionColumnId,
            ...(dimensionGrouping ? { grouping: dimensionGrouping } : {}),
        },
        ...(seriesEnabled
            ? {
                  series: {
                      columnId: seriesColumnId,
                      topN: seriesTopN,
                      ...(chartType === 'bar' ? { otherBucket: seriesOtherBucket } : {}),
                  },
              }
            : {}),
        measures,
    };
};

const needsColumn = (aggregate: Aggregate) => aggregate !== 'count';

const getGroupingMode = (grouping: unknown): GroupingMode => {
    const g = grouping as { kind?: string } | undefined | null;
    if (g?.kind === 'time') {
        return 'time';
    }
    if (g?.kind === 'numeric') {
        return 'numeric';
    }

    return 'none';
};

export const configToBuilderFields = (
    config: Record<string, unknown>,
    chartType: ChartType
): Partial<ChartBuilderFields> => {
    const result: Partial<ChartBuilderFields> = { chartType };

    result.chartColor = getChartColorFromConfig(config);

    if (typeof config.limit === 'number') {
        result.limit = config.limit;
    }
    const filters = config.filters as
        | Array<{ columnId: string; op: FilterOperation; value?: unknown }>
        | undefined;
    if (filters?.[0]) {
        result.filterEnabled = true;
        result.filterColumnId = filters[0].columnId;
        result.filterOperation = filters[0].op;
        const val = filters[0].value;
        if (Array.isArray(val)) {
            result.filterValue = val.join(', ');
        } else if (val !== undefined && val !== null) {
            result.filterValue = String(val);
        }
    }

    if (chartType === 'pie') {
        const slice = config.slice as
            | { columnId?: string; topN?: number; otherBucket?: boolean }
            | undefined;
        const measure = config.measure as
            | {
                  aggregate?: Aggregate;
                  columnId?: string;
                  valueFormat?: MeasureValueFormat;
              }
            | undefined;
        if (slice?.columnId) {
            result.dimensionColumnId = slice.columnId;
        }
        if (slice?.topN !== undefined) {
            result.topN = slice.topN;
        }
        if (slice?.otherBucket !== undefined) {
            result.seriesOtherBucket = slice.otherBucket;
        }
        if (measure?.aggregate) {
            result.aggregate = measure.aggregate;
        }
        if (measure?.columnId) {
            result.measureColumnId = measure.columnId;
        }
        if (measure?.valueFormat) {
            result.valueFormat = measure.valueFormat;
        }

        return result;
    }

    if (chartType === 'heatmap') {
        const x = config.x as { columnId?: string; grouping?: unknown } | undefined;
        const y = config.y as { columnId?: string; grouping?: unknown } | undefined;
        const measure = config.measure as
            | {
                  aggregate?: Aggregate;
                  columnId?: string;
                  valueFormat?: MeasureValueFormat;
              }
            | undefined;
        const xg = x?.grouping as
            | { granularity?: TimeGranularity; step?: number }
            | undefined;
        const yg = y?.grouping as
            | { granularity?: TimeGranularity; step?: number }
            | undefined;
        if (x?.columnId) {
            result.dimensionColumnId = x.columnId;
        }
        result.dimensionGroupingMode = getGroupingMode(x?.grouping);
        if (xg?.granularity) {
            result.dimensionGranularity = xg.granularity;
        }
        if (xg?.step !== undefined) {
            result.dimensionStep = xg.step;
        }
        if (y?.columnId) {
            result.heatmapYColumnId = y.columnId;
        }
        result.heatmapYGroupingMode = getGroupingMode(y?.grouping);
        if (yg?.granularity) {
            result.heatmapYGranularity = yg.granularity;
        }
        if (yg?.step !== undefined) {
            result.heatmapYStep = yg.step;
        }
        if (measure?.aggregate) {
            result.aggregate = measure.aggregate;
        }
        if (measure?.columnId) {
            result.measureColumnId = measure.columnId;
        }
        if (measure?.valueFormat) {
            result.valueFormat = measure.valueFormat;
        }

        return result;
    }

    // bar / line
    const dimension = config.dimension as
        | { columnId?: string; grouping?: unknown }
        | undefined;
    const dg = dimension?.grouping as
        | { granularity?: TimeGranularity; step?: number }
        | undefined;
    if (dimension?.columnId) {
        result.dimensionColumnId = dimension.columnId;
    }
    result.dimensionGroupingMode = getGroupingMode(dimension?.grouping);
    if (dg?.granularity) {
        result.dimensionGranularity = dg.granularity;
    }
    if (dg?.step !== undefined) {
        result.dimensionStep = dg.step;
    }

    const series = config.series as
        | { columnId?: string; topN?: number; otherBucket?: boolean }
        | undefined;
    result.seriesEnabled = Boolean(series);
    if (series?.columnId) {
        result.seriesColumnId = series.columnId;
    }
    if (series?.topN !== undefined) {
        result.seriesTopN = series.topN;
    }
    if (series?.otherBucket !== undefined) {
        result.seriesOtherBucket = series.otherBucket;
    }

    const measures = config.measures as
        | Array<{
              aggregate?: Aggregate;
              columnId?: string;
              valueFormat?: MeasureValueFormat;
          }>
        | undefined;
    if (measures?.[0]?.aggregate) {
        result.aggregate = measures[0].aggregate;
    }
    if (measures?.[0]?.columnId) {
        result.measureColumnId = measures[0].columnId;
    }
    if (measures?.[0]?.valueFormat) {
        result.valueFormat = measures[0].valueFormat;
    }
    if (measures?.[1]) {
        result.secondMeasureEnabled = true;
        if (measures[1].aggregate) {
            result.secondAggregate = measures[1].aggregate;
        }
        if (measures[1].columnId) {
            result.secondMeasureColumnId = measures[1].columnId;
        }
        if (measures[1].valueFormat) {
            result.secondValueFormat = measures[1].valueFormat;
        }
    } else {
        result.secondMeasureEnabled = false;
    }

    return result;
};

type DatasetChartBuilderProps = {
    orgId: string;
    selectedDataset: DatasetMetadata;
    onChartCreated?: (chartId: string) => void;
    editChartId?: string;
    initialFields?: Partial<ChartBuilderFields>;
    onChartUpdated?: (chartId: string) => void;
};

export const DatasetChartBuilder = ({
    orgId,
    selectedDataset,
    onChartCreated,
    editChartId,
    initialFields,
    onChartUpdated,
}: DatasetChartBuilderProps) => {
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [chartError, setChartError] = useState('');
    const [previewData, setPreviewData] = useState<ChartResponse | null>(null);
    const [savedConfig, setSavedConfig] = useState<ChartConfig | null>(null);

    const {
        chartName,
        setChartName,
        chartColor,
        setChartColor,
        chartType,
        setChartType,
        dimensionColumnId,
        setDimensionColumnId,
        dimensionGroupingMode,
        setDimensionGroupingMode,
        dimensionGranularity,
        setDimensionGranularity,
        dimensionStep,
        setDimensionStep,
        heatmapYColumnId,
        setHeatmapYColumnId,
        heatmapYGroupingMode,
        setHeatmapYGroupingMode,
        heatmapYGranularity,
        setHeatmapYGranularity,
        heatmapYStep,
        setHeatmapYStep,
        aggregate,
        setAggregate,
        valueFormat,
        setValueFormat,
        measureColumnId,
        setMeasureColumnId,
        secondMeasureEnabled,
        setSecondMeasureEnabled,
        secondAggregate,
        setSecondAggregate,
        secondValueFormat,
        setSecondValueFormat,
        secondMeasureColumnId,
        setSecondMeasureColumnId,
        topN,
        setTopN,
        seriesEnabled,
        setSeriesEnabled,
        seriesColumnId,
        setSeriesColumnId,
        seriesTopN,
        setSeriesTopN,
        seriesOtherBucket,
        setSeriesOtherBucket,
        filterEnabled,
        setFilterEnabled,
        filterColumnId,
        setFilterColumnId,
        filterOperation,
        setFilterOperation,
        filterValue,
        setFilterValue,
    } = useChartBuilderState(selectedDataset.dataset.id, initialFields);

    const [previewChart, previewState] = usePreviewChartDataMutation();
    const [createChart, createChartState] = useCreateChartMutation();
    const [updateChart, updateChartState] = useUpdateChartMutation();
    const builderRef = useRef<HTMLElement>(null);

    useHasOverflow(builderRef);

    const columns = selectedDataset.columns;
    const allowDisabledAnalysisColumn = Boolean(editChartId);
    const numericColumns = useMemo(
        () => columns.filter(column => column.dataType === 'number'),
        [columns]
    );

    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        dimensionColumnId,
        allowDisabledAnalysisColumn
    );
    const activeDimensionColumn = columns.find(c => c.id === activeDimensionColumnId);

    const activeHeatmapYColumnId = getActiveAnalysisColumnId(
        columns,
        heatmapYColumnId,
        allowDisabledAnalysisColumn,
        1
    );
    const activeHeatmapYColumn = columns.find(c => c.id === activeHeatmapYColumnId);

    // count_distinct works on any column type, other aggregates need numeric
    const measureColumns = aggregate === 'count_distinct' ? columns : numericColumns;
    const activeMeasureColumnId = getActiveAnalysisColumnId(
        measureColumns,
        measureColumnId,
        allowDisabledAnalysisColumn
    );

    const secondMeasureColumns =
        secondAggregate === 'count_distinct' ? columns : numericColumns;
    const activeSecondMeasureColumnId = getActiveAnalysisColumnId(
        secondMeasureColumns,
        secondMeasureColumnId,
        allowDisabledAnalysisColumn,
        1
    );

    const activeSeriesColumnId = getActiveAnalysisColumnId(
        columns,
        seriesColumnId,
        allowDisabledAnalysisColumn
    );
    const activeFilterColumnId = getActiveAnalysisColumnId(
        columns,
        filterColumnId,
        allowDisabledAnalysisColumn
    );
    const activeFilterColumn = columns.find(column => column.id === activeFilterColumnId);

    // grouping modes available depend on column data type
    const dimGroupingModes = useMemo((): GroupingMode[] => {
        const t = activeDimensionColumn?.dataType;
        const modes: GroupingMode[] = ['none'];
        if (t === 'date') {
            modes.push('time');
        }

        if (t === 'number') {
            modes.push('numeric');
        }

        return modes;
    }, [activeDimensionColumn?.dataType]);

    const heatmapYGroupingModes = useMemo((): GroupingMode[] => {
        const t = activeHeatmapYColumn?.dataType;
        const modes: GroupingMode[] = ['none'];
        if (t === 'date') {
            modes.push('time');
        }

        if (t === 'number') {
            modes.push('numeric');
        }

        return modes;
    }, [activeHeatmapYColumn?.dataType]);

    const nullaryFilter = filterOperation === 'is_null' || filterOperation === 'not_null';
    const selectedAnalysisColumnsEnabled =
        isAnalysisColumnEnabled(columns, activeDimensionColumnId) &&
        (chartType !== 'heatmap' ||
            isAnalysisColumnEnabled(columns, activeHeatmapYColumnId)) &&
        (!needsColumn(aggregate) ||
            isAnalysisColumnEnabled(measureColumns, activeMeasureColumnId)) &&
        (!secondMeasureEnabled ||
            chartType === 'pie' ||
            chartType === 'heatmap' ||
            !needsColumn(secondAggregate) ||
            isAnalysisColumnEnabled(secondMeasureColumns, activeSecondMeasureColumnId)) &&
        (!seriesEnabled ||
            chartType === 'pie' ||
            chartType === 'heatmap' ||
            isAnalysisColumnEnabled(columns, activeSeriesColumnId)) &&
        (!filterEnabled ||
            (activeFilterColumn
                ? isAnalysisColumnEnabled(columns, activeFilterColumn.id)
                : false));
    const canPreview =
        Boolean(activeDimensionColumnId) &&
        (chartType !== 'heatmap' || Boolean(activeHeatmapYColumnId)) &&
        (chartType !== 'heatmap' || activeDimensionColumnId !== activeHeatmapYColumnId) &&
        (!needsColumn(aggregate) || Boolean(activeMeasureColumnId)) &&
        (!secondMeasureEnabled ||
            !needsColumn(secondAggregate) ||
            Boolean(activeSecondMeasureColumnId)) &&
        (!seriesEnabled || Boolean(activeSeriesColumnId)) &&
        selectedAnalysisColumnsEnabled;

    // reset grouping mode when switching to a column that doesn't support it
    const handleDimensionColumnChange = (newId: string) => {
        const newType = columns.find(c => c.id === newId)?.dataType;
        setDimensionColumnId(newId);
        if (
            (dimensionGroupingMode === 'time' && newType !== 'date') ||
            (dimensionGroupingMode === 'numeric' && newType !== 'number')
        ) {
            setDimensionGroupingMode('none');
        }
    };

    const handleHeatmapYColumnChange = (newId: string) => {
        const newType = columns.find(c => c.id === newId)?.dataType;
        setHeatmapYColumnId(newId);
        if (
            (heatmapYGroupingMode === 'time' && newType !== 'date') ||
            (heatmapYGroupingMode === 'numeric' && newType !== 'number')
        ) {
            setHeatmapYGroupingMode('none');
        }
    };

    const buildCurrentConfig = () => {
        if (
            chartType === 'heatmap' &&
            activeDimensionColumnId === activeHeatmapYColumnId
        ) {
            setChartError('X and Y axes must be different columns.');

            return null;
        }

        if (!canPreview) {
            setChartError('Choose columns included in analysis for this chart.');

            return null;
        }

        if (filterEnabled && !nullaryFilter && !filterValue.trim()) {
            setChartError('Fill filter value or turn the filter off.');

            return null;
        }

        if (filterEnabled && filterOperation === 'between') {
            const parts = filterValue
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
            if (parts.length !== 2) {
                setChartError('Between filter expects two comma-separated values.');

                return null;
            }
        }

        const filter =
            filterEnabled && activeFilterColumn
                ? buildFilter(activeFilterColumn, filterOperation, filterValue)
                : null;

        setChartError('');

        // clamp to supported modes for the current column type (safety net if state is stale)
        const effectiveDimGroupingMode = dimGroupingModes.includes(dimensionGroupingMode)
            ? dimensionGroupingMode
            : 'none';
        const effectiveHeatmapYGroupingMode = heatmapYGroupingModes.includes(
            heatmapYGroupingMode
        )
            ? heatmapYGroupingMode
            : 'none';

        return buildChartConfig({
            chartType,
            chartColor,
            dimensionColumnId: activeDimensionColumnId,
            dimensionGrouping: buildGrouping(
                effectiveDimGroupingMode,
                dimensionGranularity,
                dimensionStep
            ),
            heatmapYColumnId: activeHeatmapYColumnId,
            heatmapYGrouping: buildGrouping(
                effectiveHeatmapYGroupingMode,
                heatmapYGranularity,
                heatmapYStep
            ),
            aggregate,
            valueFormat,
            measureColumnId: activeMeasureColumnId,
            secondMeasureEnabled:
                secondMeasureEnabled && chartType !== 'pie' && chartType !== 'heatmap',
            secondAggregate,
            secondValueFormat,
            secondMeasureColumnId: activeSecondMeasureColumnId,
            limit: CHART_ROW_LIMIT,
            topN,
            seriesEnabled:
                seriesEnabled && chartType !== 'pie' && chartType !== 'heatmap',
            seriesColumnId: activeSeriesColumnId,
            seriesTopN,
            seriesOtherBucket,
            filter,
        });
    };

    const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const config = buildCurrentConfig();
        if (!config) {
            return;
        }

        try {
            const data = await previewChart({
                datasetId: selectedDataset.dataset.id,
                chartType,
                config,
            }).unwrap();

            setSavedConfig(config);
            setPreviewData(data);
            setStep('preview');
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to preview this chart.'));
        }
    };

    const saveChartConfig = async (config: ChartConfig) => {
        const fallbackName = `${selectedDataset.dataset.name} ${chartType}`;
        const name = chartName.trim() || fallbackName;

        try {
            if (editChartId) {
                await updateChart({
                    chartId: editChartId,
                    name,
                    chartType,
                    config,
                }).unwrap();
                onChartUpdated?.(editChartId);
            } else {
                const chart = await createChart({
                    orgId,
                    datasetId: selectedDataset.dataset.id,
                    name,
                    chartType,
                    config,
                }).unwrap();
                onChartCreated?.(chart.id);
            }
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to save this chart.'));
        }
    };

    const handleSave = async () => {
        if (!savedConfig) {
            return;
        }

        await saveChartConfig(savedConfig);
    };

    const handleSaveWithoutPreview = async () => {
        const config = buildCurrentConfig();
        if (!config) {
            return;
        }

        await saveChartConfig(config);
    };

    const isSaving = editChartId
        ? updateChartState.isLoading
        : createChartState.isLoading;

    if (step === 'preview' && previewData) {
        return (
            <section
                ref={builderRef}
                className={styles['builder']}
                data-stack="v"
                data-gap="md"
                data-flex
                aria-label="Chart builder"
            >
                <div
                    className={styles['section']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    Preview
                </div>
                <div data-stack="v" data-gap="sm">
                    {!editChartId && (
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Chart name</span>
                            <TextInput
                                value={chartName}
                                placeholder={`${selectedDataset.dataset.name} ${chartType}`}
                                onChange={event => setChartName(event.target.value)}
                            />
                        </label>
                    )}

                    <ChartResult
                        data={previewData}
                        kind={previewData.kind}
                        ariaLabel="Chart preview"
                        color={chartColor}
                        barsLimit={8}
                        hideTable
                    />

                    {savedConfig && (
                        <ChartConfigSummary
                            chartType={chartType}
                            config={savedConfig}
                            columns={columns}
                        />
                    )}

                    <div data-stack="h" data-gap="sm">
                        <Button
                            type="button"
                            onClick={() => {
                                setChartError('');
                                setStep('config');
                            }}
                        >
                            <PencilLine size={18} />
                            Edit
                        </Button>
                        <Button
                            type="button"
                            disabled={isSaving}
                            isLoading={isSaving}
                            onClick={() => void handleSave()}
                        >
                            <Save size={18} />
                            {editChartId ? 'Save changes' : 'Save chart'}
                        </Button>
                    </div>

                    {chartError && (
                        <StatusMessage tone="error">{chartError}</StatusMessage>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section
            ref={builderRef}
            className={styles['builder']}
            data-stack="v"
            data-gap="md"
            data-flex
            aria-label="Chart builder"
        >
            <form
                className={styles['chart-form']}
                data-display="grid"
                data-gap="sm"
                onSubmit={handlePreview}
            >
                <div
                    className={styles['section']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    Chart
                </div>

                {!editChartId && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Chart name</span>
                        <TextInput
                            value={chartName}
                            placeholder={`${selectedDataset.dataset.name} chart`}
                            onChange={event => setChartName(event.target.value)}
                        />
                    </label>
                )}

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Chart type</span>
                    <Select
                        value={chartType}
                        onChange={event => setChartType(event.target.value as ChartType)}
                    >
                        {chartTypes.map(type => (
                            <option key={type} value={type}>
                                {CHART_TYPE_LABELS[type]}
                            </option>
                        ))}
                    </Select>
                </label>

                <ColorPickerControl value={chartColor} onChange={setChartColor} />

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>{chartType === 'pie' ? 'Slice by' : 'X axis'}</span>
                    <Select
                        value={activeDimensionColumnId}
                        onChange={event =>
                            handleDimensionColumnChange(event.target.value)
                        }
                    >
                        <AnalysisColumnOptions columns={columns} />
                    </Select>
                </label>

                {chartType === 'heatmap' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Y axis</span>
                        <Select
                            value={activeHeatmapYColumnId}
                            onChange={event =>
                                handleHeatmapYColumnChange(event.target.value)
                            }
                        >
                            <AnalysisColumnOptions columns={columns} />
                        </Select>
                    </label>
                )}

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>{chartType === 'heatmap' ? 'Group X by' : 'Group by'}</span>
                    <Select
                        value={
                            dimGroupingModes.includes(dimensionGroupingMode)
                                ? dimensionGroupingMode
                                : 'none'
                        }
                        disabled={dimGroupingModes.length === 1}
                        onChange={event =>
                            setDimensionGroupingMode(event.target.value as GroupingMode)
                        }
                    >
                        {dimGroupingModes.map(mode => (
                            <option key={mode} value={mode}>
                                {GROUPING_LABELS[mode]}
                            </option>
                        ))}
                    </Select>
                </label>

                {dimensionGroupingMode === 'time' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Time unit</span>
                        <Select
                            value={dimensionGranularity}
                            onChange={event =>
                                setDimensionGranularity(
                                    event.target.value as TimeGranularity
                                )
                            }
                        >
                            {timeGranularities.map(item => (
                                <option key={item} value={item}>
                                    {GRANULARITY_LABELS[item]}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}

                {dimensionGroupingMode === 'numeric' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Bucket size</span>
                        <TextInput
                            type="number"
                            min={1}
                            value={dimensionStep}
                            onChange={event =>
                                setDimensionStep(Math.max(1, Number(event.target.value)))
                            }
                        />
                    </label>
                )}

                {chartType === 'heatmap' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Group Y by</span>
                        <Select
                            value={
                                heatmapYGroupingModes.includes(heatmapYGroupingMode)
                                    ? heatmapYGroupingMode
                                    : 'none'
                            }
                            disabled={heatmapYGroupingModes.length === 1}
                            onChange={event =>
                                setHeatmapYGroupingMode(
                                    event.target.value as GroupingMode
                                )
                            }
                        >
                            {heatmapYGroupingModes.map(mode => (
                                <option key={mode} value={mode}>
                                    {GROUPING_LABELS[mode]}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}

                {chartType === 'heatmap' && heatmapYGroupingMode === 'time' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Y time unit</span>
                        <Select
                            value={heatmapYGranularity}
                            onChange={event =>
                                setHeatmapYGranularity(
                                    event.target.value as TimeGranularity
                                )
                            }
                        >
                            {timeGranularities.map(item => (
                                <option key={item} value={item}>
                                    {GRANULARITY_LABELS[item]}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}

                {chartType === 'heatmap' && heatmapYGroupingMode === 'numeric' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Y bucket size</span>
                        <TextInput
                            type="number"
                            min={1}
                            value={heatmapYStep}
                            onChange={event =>
                                setHeatmapYStep(Math.max(1, Number(event.target.value)))
                            }
                        />
                    </label>
                )}

                <div
                    className={styles['section']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    Measure
                </div>

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Aggregation</span>
                    <Select
                        value={aggregate}
                        onChange={event => setAggregate(event.target.value as Aggregate)}
                    >
                        {aggregates.map(item => (
                            <option key={item} value={item}>
                                {AGGREGATE_LABELS[item]}
                            </option>
                        ))}
                    </Select>
                </label>

                {needsColumn(aggregate) && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Column</span>
                        <Select
                            data-testid="primary-measure-select"
                            value={activeMeasureColumnId}
                            onChange={event => setMeasureColumnId(event.target.value)}
                        >
                            <AnalysisColumnOptions columns={measureColumns} />
                        </Select>
                    </label>
                )}

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Value format</span>
                    <Select
                        value={valueFormat}
                        onChange={event =>
                            setValueFormat(event.target.value as MeasureValueFormat)
                        }
                    >
                        {valueFormats.map(item => (
                            <option key={item} value={item}>
                                {VALUE_FORMAT_LABELS[item]}
                            </option>
                        ))}
                    </Select>
                </label>

                {chartType !== 'pie' && chartType !== 'heatmap' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>2nd measure</span>
                        <Select
                            value={secondMeasureEnabled ? 'on' : 'off'}
                            onChange={event =>
                                setSecondMeasureEnabled(event.target.value === 'on')
                            }
                        >
                            <option value="off">Off</option>
                            <option value="on">On</option>
                        </Select>
                    </label>
                )}

                {secondMeasureEnabled &&
                    chartType !== 'pie' &&
                    chartType !== 'heatmap' && (
                        <>
                            <label
                                className={styles['control']}
                                data-stack="v"
                                data-gap="xs"
                            >
                                <span>2nd aggregation</span>
                                <Select
                                    value={secondAggregate}
                                    onChange={event =>
                                        setSecondAggregate(
                                            event.target.value as Aggregate
                                        )
                                    }
                                >
                                    {aggregates.map(item => (
                                        <option key={item} value={item}>
                                            {AGGREGATE_LABELS[item]}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                            <label
                                className={styles['control']}
                                data-stack="v"
                                data-gap="xs"
                            >
                                <span>2nd value format</span>
                                <Select
                                    value={secondValueFormat}
                                    onChange={event =>
                                        setSecondValueFormat(
                                            event.target.value as MeasureValueFormat
                                        )
                                    }
                                >
                                    {valueFormats.map(item => (
                                        <option key={item} value={item}>
                                            {VALUE_FORMAT_LABELS[item]}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                            {needsColumn(secondAggregate) && (
                                <label
                                    className={styles['control']}
                                    data-stack="v"
                                    data-gap="xs"
                                >
                                    <span>2nd column</span>
                                    <Select
                                        data-testid="second-measure-select"
                                        value={activeSecondMeasureColumnId}
                                        onChange={event =>
                                            setSecondMeasureColumnId(event.target.value)
                                        }
                                    >
                                        <AnalysisColumnOptions
                                            columns={secondMeasureColumns}
                                        />
                                    </Select>
                                </label>
                            )}
                        </>
                    )}

                {chartType === 'pie' && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Max slices</span>
                        <TextInput
                            type="number"
                            min={1}
                            max={50}
                            value={topN}
                            onChange={event =>
                                setTopN(
                                    Math.max(1, Math.min(50, Number(event.target.value)))
                                )
                            }
                        />
                    </label>
                )}

                {chartType !== 'pie' && chartType !== 'heatmap' && (
                    <div
                        className={styles['section']}
                        data-stack="h"
                        data-gap="sm"
                        data-align="center"
                    >
                        <span>Breakdown</span>
                        <Switch
                            aria-label="Enable breakdown"
                            checked={seriesEnabled}
                            onChange={event => setSeriesEnabled(event.target.checked)}
                        />
                    </div>
                )}

                {seriesEnabled && chartType !== 'pie' && chartType !== 'heatmap' && (
                    <>
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Split by</span>
                            <Select
                                value={activeSeriesColumnId}
                                onChange={event => setSeriesColumnId(event.target.value)}
                            >
                                <AnalysisColumnOptions columns={columns} />
                            </Select>
                        </label>
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Max categories</span>
                            <TextInput
                                type="number"
                                min={1}
                                max={50}
                                value={seriesTopN}
                                onChange={event =>
                                    setSeriesTopN(
                                        Math.max(
                                            1,
                                            Math.min(50, Number(event.target.value))
                                        )
                                    )
                                }
                            />
                        </label>
                        {chartType === 'bar' && (
                            <label
                                className={styles['control']}
                                data-stack="v"
                                data-gap="xs"
                            >
                                <span>Group others</span>
                                <Select
                                    value={seriesOtherBucket ? 'on' : 'off'}
                                    onChange={event =>
                                        setSeriesOtherBucket(event.target.value === 'on')
                                    }
                                >
                                    <option value="on">On</option>
                                    <option value="off">Off</option>
                                </Select>
                            </label>
                        )}
                    </>
                )}

                <div
                    className={styles['section']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    <span>Filter</span>
                    <Switch
                        aria-label="Filter rows"
                        checked={filterEnabled}
                        onChange={event => setFilterEnabled(event.target.checked)}
                    />
                </div>

                {filterEnabled && (
                    <>
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Filter column</span>
                            <Select
                                value={activeFilterColumn?.id ?? ''}
                                onChange={event => setFilterColumnId(event.target.value)}
                            >
                                <AnalysisColumnOptions columns={columns} />
                            </Select>
                        </label>

                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Condition</span>
                            <Select
                                value={filterOperation}
                                onChange={event =>
                                    setFilterOperation(
                                        event.target.value as FilterOperation
                                    )
                                }
                            >
                                {filterOperations.map(operation => (
                                    <option key={operation} value={operation}>
                                        {FILTER_OP_LABELS[operation]}
                                    </option>
                                ))}
                            </Select>
                        </label>

                        {!nullaryFilter && (
                            <label
                                className={styles['control']}
                                data-stack="v"
                                data-gap="xs"
                            >
                                <span>Value</span>
                                <TextInput
                                    value={filterValue}
                                    placeholder={
                                        filterOperation === 'between'
                                            ? 'min, max'
                                            : filterOperation === 'in' ||
                                                filterOperation === 'nin'
                                              ? 'a, b, c'
                                              : undefined
                                    }
                                    onChange={event => setFilterValue(event.target.value)}
                                />
                            </label>
                        )}
                    </>
                )}

                <Separator className={styles['actions-separator']} />
                <div
                    className={styles['actions']}
                    data-stack="h"
                    data-gap="sm"
                    data-wrap="wrap"
                >
                    <Button
                        type="submit"
                        disabled={!canPreview || previewState.isLoading}
                        isLoading={previewState.isLoading}
                    >
                        <Play size={18} />
                        Preview
                    </Button>
                    {editChartId && (
                        <Button
                            type="button"
                            disabled={!canPreview || isSaving}
                            isLoading={isSaving}
                            onClick={() => void handleSaveWithoutPreview()}
                        >
                            <Save size={18} />
                            Save
                        </Button>
                    )}
                </div>
            </form>

            {chartError && <StatusMessage tone="error">{chartError}</StatusMessage>}
        </section>
    );
};
