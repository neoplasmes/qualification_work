import { ChartNoAxesColumnIncreasing, FolderKanban, Play, Save } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import {
    ChartResult,
    type ChartResponse,
    type ChartType,
    type FilterClause,
    type FilterOperation,
} from '@/entities/chart';
import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import {
    Button,
    ButtonLink,
    EntityHeader,
    Select,
    StatusMessage,
    TextInput,
} from '@/shared/ui';

import {
    useCreateChartMutation,
    usePreviewChartDataMutation,
    useUpdateChartMutation,
    type Aggregate,
    type AxisGrouping,
    type TimeGranularity,
} from '../api';
import {
    useChartBuilderState,
    type ChartBuilderFields,
} from '../lib/useChartBuilderState';

import styles from './DatasetChartBuilder.module.scss';

const chartTypes = ['bar', 'line', 'pie', 'heatmap'] as const;
const aggregates = ['count', 'sum', 'avg', 'min', 'max', 'count_distinct'] as const;
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

const CHART_TYPE_LABELS: Record<ChartType, string> = {
    bar: 'Bar',
    line: 'Line',
    pie: 'Pie',
    heatmap: 'Heatmap',
};

const AGGREGATE_LABELS: Record<Aggregate, string> = {
    count: 'Count',
    sum: 'Sum',
    avg: 'Average',
    min: 'Min',
    max: 'Max',
    count_distinct: 'Count unique',
};

const GROUPING_LABELS: Record<GroupingMode, string> = {
    none: 'None',
    time: 'By time',
    numeric: 'By range',
};

const GRANULARITY_LABELS: Record<TimeGranularity, string> = {
    hour: 'Hour',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
};

const FILTER_OP_LABELS: Record<FilterOperation, string> = {
    eq: '= equals',
    neq: '≠ not equals',
    gt: '> greater',
    gte: '≥ greater or equal',
    lt: '< less',
    lte: '≤ less or equal',
    in: 'in list',
    nin: 'not in list',
    between: 'between',
    is_null: 'is empty',
    not_null: 'is not empty',
};

const SORT_LABELS: Record<'asc' | 'desc', string> = {
    desc: 'Highest first',
    asc: 'Lowest first',
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

const buildMeasure = (aggregate: Aggregate, measureColumnId: string, alias?: string) =>
    aggregate === 'count'
        ? { aggregate, ...(alias ? { alias } : {}) }
        : { aggregate, columnId: measureColumnId, ...(alias ? { alias } : {}) };

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
    dimensionColumnId: string;
    dimensionGrouping: AxisGrouping | undefined;
    heatmapYColumnId: string;
    heatmapYGrouping: AxisGrouping | undefined;
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
    filter: FilterClause | null;
};

const buildChartConfig = ({
    chartType,
    dimensionColumnId,
    dimensionGrouping,
    heatmapYColumnId,
    heatmapYGrouping,
    aggregate,
    measureColumnId,
    secondMeasureEnabled,
    secondAggregate,
    secondMeasureColumnId,
    limit,
    topN,
    sortDirection,
    seriesEnabled,
    seriesColumnId,
    seriesTopN,
    seriesOtherBucket,
    filter,
}: BuildChartConfigInput) => {
    const firstMeasure = buildMeasure(aggregate, measureColumnId);
    const base = {
        limit,
        orderBy: { ref: 'measure', index: 0, dir: sortDirection },
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
            ? [buildMeasure(secondAggregate, secondMeasureColumnId, 'm1')]
            : []),
    ];

    return {
        ...base,
        kind: chartType,
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

    if (typeof config.limit === 'number') {
        result.limit = config.limit;
    }
    const orderBy = config.orderBy as { dir?: string } | undefined;
    if (orderBy?.dir === 'asc' || orderBy?.dir === 'desc') {
        result.sortDirection = orderBy.dir;
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
            | { aggregate?: Aggregate; columnId?: string }
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

        return result;
    }

    if (chartType === 'heatmap') {
        const x = config.x as { columnId?: string; grouping?: unknown } | undefined;
        const y = config.y as { columnId?: string; grouping?: unknown } | undefined;
        const measure = config.measure as
            | { aggregate?: Aggregate; columnId?: string }
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
        | Array<{ aggregate?: Aggregate; columnId?: string }>
        | undefined;
    if (measures?.[0]?.aggregate) {
        result.aggregate = measures[0].aggregate;
    }
    if (measures?.[0]?.columnId) {
        result.measureColumnId = measures[0].columnId;
    }
    if (measures?.[1]) {
        result.secondMeasureEnabled = true;
        if (measures[1].aggregate) {
            result.secondAggregate = measures[1].aggregate;
        }
        if (measures[1].columnId) {
            result.secondMeasureColumnId = measures[1].columnId;
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
    const [savedConfig, setSavedConfig] = useState<Record<string, unknown> | null>(null);

    const {
        chartName,
        setChartName,
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
        measureColumnId,
        setMeasureColumnId,
        secondMeasureEnabled,
        setSecondMeasureEnabled,
        secondAggregate,
        setSecondAggregate,
        secondMeasureColumnId,
        setSecondMeasureColumnId,
        limit,
        setLimit,
        topN,
        setTopN,
        sortDirection,
        setSortDirection,
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

    const columns = selectedDataset.columns;
    const numericColumns = useMemo(
        () => columns.filter(column => column.dataType === 'number'),
        [columns]
    );

    const activeDimensionColumnId = columns.some(c => c.id === dimensionColumnId)
        ? dimensionColumnId
        : (columns[0]?.id ?? '');
    const activeDimensionColumn = columns.find(c => c.id === activeDimensionColumnId);

    const activeHeatmapYColumnId = columns.some(c => c.id === heatmapYColumnId)
        ? heatmapYColumnId
        : (columns[1]?.id ?? columns[0]?.id ?? '');
    const activeHeatmapYColumn = columns.find(c => c.id === activeHeatmapYColumnId);

    // count_distinct works on any column type, other aggregates need numeric
    const measureColumns = aggregate === 'count_distinct' ? columns : numericColumns;
    const activeMeasureColumnId = measureColumns.some(c => c.id === measureColumnId)
        ? measureColumnId
        : (measureColumns[0]?.id ?? '');

    const secondMeasureColumns =
        secondAggregate === 'count_distinct' ? columns : numericColumns;
    const activeSecondMeasureColumnId = secondMeasureColumns.some(
        c => c.id === secondMeasureColumnId
    )
        ? secondMeasureColumnId
        : (secondMeasureColumns[1]?.id ?? secondMeasureColumns[0]?.id ?? '');

    const activeSeriesColumnId = columns.some(c => c.id === seriesColumnId)
        ? seriesColumnId
        : (columns[0]?.id ?? '');
    const activeFilterColumn =
        columns.find(column => column.id === filterColumnId) ?? columns[0];

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
    const canPreview =
        Boolean(activeDimensionColumnId) &&
        (chartType !== 'heatmap' || Boolean(activeHeatmapYColumnId)) &&
        (chartType !== 'heatmap' || activeDimensionColumnId !== activeHeatmapYColumnId) &&
        (!needsColumn(aggregate) || Boolean(activeMeasureColumnId)) &&
        (!secondMeasureEnabled ||
            !needsColumn(secondAggregate) ||
            Boolean(activeSecondMeasureColumnId)) &&
        (!seriesEnabled || Boolean(activeSeriesColumnId));

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

    const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            chartType === 'heatmap' &&
            activeDimensionColumnId === activeHeatmapYColumnId
        ) {
            setChartError('X and Y axes must be different columns.');

            return;
        }

        if (!canPreview) {
            setChartError('Choose compatible columns for this chart.');

            return;
        }

        if (filterEnabled && !nullaryFilter && !filterValue.trim()) {
            setChartError('Fill filter value or turn the filter off.');

            return;
        }

        if (filterEnabled && filterOperation === 'between') {
            const parts = filterValue
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
            if (parts.length !== 2) {
                setChartError('Between filter expects two comma-separated values.');

                return;
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

        const config = buildChartConfig({
            chartType,
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
            measureColumnId: activeMeasureColumnId,
            secondMeasureEnabled:
                secondMeasureEnabled && chartType !== 'pie' && chartType !== 'heatmap',
            secondAggregate,
            secondMeasureColumnId: activeSecondMeasureColumnId,
            limit,
            topN,
            sortDirection,
            seriesEnabled:
                seriesEnabled && chartType !== 'pie' && chartType !== 'heatmap',
            seriesColumnId: activeSeriesColumnId,
            seriesTopN,
            seriesOtherBucket,
            filter,
        });

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

    const handleSave = async () => {
        if (!savedConfig) {
            return;
        }

        const fallbackName = `${selectedDataset.dataset.name} ${chartType}`;
        const name = chartName.trim() || fallbackName;

        try {
            if (editChartId) {
                await updateChart({
                    chartId: editChartId,
                    name,
                    chartType,
                    config: savedConfig,
                }).unwrap();
                onChartUpdated?.(editChartId);
            } else {
                const chart = await createChart({
                    orgId,
                    datasetId: selectedDataset.dataset.id,
                    name,
                    chartType,
                    config: savedConfig,
                }).unwrap();
                onChartCreated?.(chart.id);
            }
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to save this chart.'));
        }
    };

    const isSaving = editChartId
        ? updateChartState.isLoading
        : createChartState.isLoading;

    if (step === 'preview' && previewData) {
        return (
            <section className={styles['chart-builder']} aria-label="Chart builder">
                <EntityHeader
                    eyebrow="Chart builder"
                    actions={<ChartNoAxesColumnIncreasing size={20} />}
                />

                <ChartResult
                    data={previewData}
                    kind={previewData.kind}
                    ariaLabel="Chart preview"
                    barsLimit={8}
                    hideTable
                />

                <div data-stack="v" data-gap="sm">
                    <label className={styles['control']}>
                        <span>Chart name</span>
                        <TextInput
                            value={chartName}
                            placeholder={`${selectedDataset.dataset.name} ${chartType}`}
                            onChange={event => setChartName(event.target.value)}
                        />
                    </label>

                    <div data-stack="h" data-gap="sm">
                        <Button
                            type="button"
                            onClick={() => {
                                setChartError('');
                                setStep('config');
                            }}
                        >
                            ← Edit
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
                        {!editChartId && (
                            <ButtonLink to="/charts">
                                <FolderKanban size={18} />
                                Open charts
                            </ButtonLink>
                        )}
                    </div>

                    {chartError && (
                        <StatusMessage tone="error">{chartError}</StatusMessage>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className={styles['chart-builder']} aria-label="Chart builder">
            <EntityHeader
                eyebrow="Chart builder"
                actions={<ChartNoAxesColumnIncreasing size={20} />}
            />

            <form className={styles['chart-form']} onSubmit={handlePreview}>
                <label className={styles['control']}>
                    <span>Chart name</span>
                    <TextInput
                        value={chartName}
                        placeholder={`${selectedDataset.dataset.name} chart`}
                        onChange={event => setChartName(event.target.value)}
                    />
                </label>

                <label className={styles['control']}>
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

                <label className={styles['control']}>
                    <span>{chartType === 'pie' ? 'Slice by' : 'X axis'}</span>
                    <Select
                        value={activeDimensionColumnId}
                        onChange={event =>
                            handleDimensionColumnChange(event.target.value)
                        }
                    >
                        {columns.map(column => (
                            <option key={column.id} value={column.id}>
                                {column.displayName}
                            </option>
                        ))}
                    </Select>
                </label>

                {chartType === 'heatmap' && (
                    <label className={styles['control']}>
                        <span>Y axis</span>
                        <Select
                            value={activeHeatmapYColumnId}
                            onChange={event =>
                                handleHeatmapYColumnChange(event.target.value)
                            }
                        >
                            {columns.map(column => (
                                <option key={column.id} value={column.id}>
                                    {column.displayName}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}

                <label className={styles['control']}>
                    <span>Group by</span>
                    <Select
                        value={
                            dimGroupingModes.includes(dimensionGroupingMode)
                                ? dimensionGroupingMode
                                : 'none'
                        }
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
                    <label className={styles['control']}>
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
                    <label className={styles['control']}>
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
                    <label className={styles['control']}>
                        <span>Group Y by</span>
                        <Select
                            value={
                                heatmapYGroupingModes.includes(heatmapYGroupingMode)
                                    ? heatmapYGroupingMode
                                    : 'none'
                            }
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
                    <label className={styles['control']}>
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
                    <label className={styles['control']}>
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

                <div className={styles['section']}>Measure</div>

                <label className={styles['control']}>
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
                    <label className={styles['control']}>
                        <span>Column</span>
                        <Select
                            data-testid="primary-measure-select"
                            value={activeMeasureColumnId}
                            onChange={event => setMeasureColumnId(event.target.value)}
                        >
                            {measureColumns.map(column => (
                                <option key={column.id} value={column.id}>
                                    {column.displayName}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}

                {chartType !== 'pie' && chartType !== 'heatmap' && (
                    <label className={styles['control']}>
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
                            <label className={styles['control']}>
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
                            {needsColumn(secondAggregate) && (
                                <label className={styles['control']}>
                                    <span>2nd column</span>
                                    <Select
                                        data-testid="second-measure-select"
                                        value={activeSecondMeasureColumnId}
                                        onChange={event =>
                                            setSecondMeasureColumnId(event.target.value)
                                        }
                                    >
                                        {secondMeasureColumns.map(column => (
                                            <option key={column.id} value={column.id}>
                                                {column.displayName}
                                            </option>
                                        ))}
                                    </Select>
                                </label>
                            )}
                        </>
                    )}

                <label className={styles['control']}>
                    <span>Sort</span>
                    <Select
                        value={sortDirection}
                        onChange={event =>
                            setSortDirection(event.target.value as 'asc' | 'desc')
                        }
                    >
                        {(['desc', 'asc'] as const).map(dir => (
                            <option key={dir} value={dir}>
                                {SORT_LABELS[dir]}
                            </option>
                        ))}
                    </Select>
                </label>

                <label className={styles['control']}>
                    <span>Row limit</span>
                    <TextInput
                        type="number"
                        min={1}
                        max={200}
                        value={limit}
                        onChange={event =>
                            setLimit(
                                Math.max(1, Math.min(200, Number(event.target.value)))
                            )
                        }
                    />
                </label>

                {chartType === 'pie' && (
                    <label className={styles['control']}>
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
                    <>
                        <div className={styles['section']}>Series</div>

                        <label className={styles['control']}>
                            <span>Color by</span>
                            <Select
                                value={seriesEnabled ? 'on' : 'off'}
                                onChange={event =>
                                    setSeriesEnabled(event.target.value === 'on')
                                }
                            >
                                <option value="off">Off</option>
                                <option value="on">On</option>
                            </Select>
                        </label>
                    </>
                )}

                {seriesEnabled && chartType !== 'pie' && chartType !== 'heatmap' && (
                    <>
                        <label className={styles['control']}>
                            <span>Color column</span>
                            <Select
                                value={activeSeriesColumnId}
                                onChange={event => setSeriesColumnId(event.target.value)}
                            >
                                {columns.map(column => (
                                    <option key={column.id} value={column.id}>
                                        {column.displayName}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label className={styles['control']}>
                            <span>Max series</span>
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
                            <label className={styles['control']}>
                                <span>Group rest</span>
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

                <div className={styles['section']}>Filter</div>

                <label className={styles['control']}>
                    <span>Filter rows</span>
                    <Select
                        value={filterEnabled ? 'on' : 'off'}
                        onChange={event => setFilterEnabled(event.target.value === 'on')}
                    >
                        <option value="off">Off</option>
                        <option value="on">On</option>
                    </Select>
                </label>

                {filterEnabled && (
                    <>
                        <label className={styles['control']}>
                            <span>Filter column</span>
                            <Select
                                value={activeFilterColumn?.id ?? ''}
                                onChange={event => setFilterColumnId(event.target.value)}
                            >
                                {columns.map(column => (
                                    <option key={column.id} value={column.id}>
                                        {column.displayName}
                                    </option>
                                ))}
                            </Select>
                        </label>

                        <label className={styles['control']}>
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
                            <label className={styles['control']}>
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

                <Button
                    type="submit"
                    disabled={!canPreview || previewState.isLoading}
                    isLoading={previewState.isLoading}
                >
                    <Play size={18} />
                    Preview
                </Button>
            </form>

            {chartError && <StatusMessage tone="error">{chartError}</StatusMessage>}
        </section>
    );
};
