import { ChartNoAxesColumnIncreasing, FolderKanban, Play, Save } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import {
    useCreateChartMutation,
    usePreviewChartDataMutation,
    type Aggregate,
    type AxisGrouping,
    type ChartResponse,
    type ChartType,
    type FilterClause,
    type FilterOperation,
    type TimeGranularity,
} from '@/features/charts';
import type { DatasetColumn, DatasetMetadata } from '@/features/datasets';

import { useChartBuilderState } from '../lib/useChartBuilderState';

import { ChartResult } from '@/entities/chart';

import { getApiErrorMessage } from '@/shared/api';
import { Button, ButtonLink } from '@/shared/ui';

import styles from './DatasetChartBuilder.module.scss';

const CHART_RESULT_LIMIT = 24;
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

type DatasetChartBuilderProps = {
    orgId: string;
    selectedDataset: DatasetMetadata;
    onChartCreated?: (chartId: string) => void;
};

export const DatasetChartBuilder = ({
    orgId,
    selectedDataset,
    onChartCreated,
}: DatasetChartBuilderProps) => {
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [chartError, setChartError] = useState('');
    const [previewData, setPreviewData] = useState<ChartResponse | null>(null);
    const [savedConfig, setSavedConfig] = useState<Record<string, unknown> | null>(null);

    const {
        chartName, setChartName,
        chartType, setChartType,
        dimensionColumnId, setDimensionColumnId,
        dimensionGroupingMode, setDimensionGroupingMode,
        dimensionGranularity, setDimensionGranularity,
        dimensionStep, setDimensionStep,
        heatmapYColumnId, setHeatmapYColumnId,
        heatmapYGroupingMode, setHeatmapYGroupingMode,
        heatmapYGranularity, setHeatmapYGranularity,
        heatmapYStep, setHeatmapYStep,
        aggregate, setAggregate,
        measureColumnId, setMeasureColumnId,
        secondMeasureEnabled, setSecondMeasureEnabled,
        secondAggregate, setSecondAggregate,
        secondMeasureColumnId, setSecondMeasureColumnId,
        limit, setLimit,
        topN, setTopN,
        sortDirection, setSortDirection,
        seriesEnabled, setSeriesEnabled,
        seriesColumnId, setSeriesColumnId,
        seriesTopN, setSeriesTopN,
        seriesOtherBucket, setSeriesOtherBucket,
        filterEnabled, setFilterEnabled,
        filterColumnId, setFilterColumnId,
        filterOperation, setFilterOperation,
        filterValue, setFilterValue,
    } = useChartBuilderState(selectedDataset.dataset.id);

    const [previewChart, previewState] = usePreviewChartDataMutation();
    const [createChart, createChartState] = useCreateChartMutation();

    const columns = selectedDataset.columns;
    const numericColumns = useMemo(
        () => columns.filter(column => column.dataType === 'number'),
        [columns]
    );
    const activeDimensionColumnId = columns.some(
        column => column.id === dimensionColumnId
    )
        ? dimensionColumnId
        : (columns[0]?.id ?? '');
    const activeHeatmapYColumnId = columns.some(column => column.id === heatmapYColumnId)
        ? heatmapYColumnId
        : (columns[1]?.id ?? columns[0]?.id ?? '');
    const activeMeasureColumnId = numericColumns.some(
        column => column.id === measureColumnId
    )
        ? measureColumnId
        : (numericColumns[0]?.id ?? '');
    const activeSecondMeasureColumnId = numericColumns.some(
        column => column.id === secondMeasureColumnId
    )
        ? secondMeasureColumnId
        : (numericColumns[1]?.id ?? numericColumns[0]?.id ?? '');
    const activeSeriesColumnId = columns.some(column => column.id === seriesColumnId)
        ? seriesColumnId
        : (columns[0]?.id ?? '');
    const activeFilterColumn =
        columns.find(column => column.id === filterColumnId) ?? columns[0];
    const nullaryFilter = filterOperation === 'is_null' || filterOperation === 'not_null';
    const canPreview =
        Boolean(activeDimensionColumnId) &&
        (chartType !== 'heatmap' || Boolean(activeHeatmapYColumnId)) &&
        (!needsColumn(aggregate) || Boolean(activeMeasureColumnId)) &&
        (!secondMeasureEnabled ||
            !needsColumn(secondAggregate) ||
            Boolean(activeSecondMeasureColumnId)) &&
        (!seriesEnabled || Boolean(activeSeriesColumnId));

    const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

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

        const config = buildChartConfig({
            chartType,
            dimensionColumnId: activeDimensionColumnId,
            dimensionGrouping: buildGrouping(
                dimensionGroupingMode,
                dimensionGranularity,
                dimensionStep
            ),
            heatmapYColumnId: activeHeatmapYColumnId,
            heatmapYGrouping: buildGrouping(
                heatmapYGroupingMode,
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
        if (!savedConfig) return;

        const fallbackName = `${selectedDataset.dataset.name} ${chartType}`;
        const name = chartName.trim() || fallbackName;

        try {
            const chart = await createChart({
                orgId,
                datasetId: selectedDataset.dataset.id,
                name,
                chartType,
                config: savedConfig,
            }).unwrap();

            onChartCreated?.(chart.id);
        } catch (error) {
            setChartError(getApiErrorMessage(error, 'Unable to save this chart.'));
        }
    };

    if (step === 'preview' && previewData) {
        return (
            <section className={styles['chart-builder']} aria-label="Chart builder">
                <div data-stack="h" data-gap="sm" data-align="center">
                    <ChartNoAxesColumnIncreasing size={20} />
                    <span className={styles['eyebrow']}>Chart builder</span>
                </div>

                <ChartResult
                    data={previewData}
                    kind={previewData.kind}
                    ariaLabel="Chart preview"
                    barsLimit={8}
                >
                    <span>
                        Dataset:{' '}
                        {selectedDataset.dataset.name}
                    </span>
                    <span>
                        Dimension:{' '}
                        {columns.find(c => c.id === activeDimensionColumnId)
                            ?.displayName ?? activeDimensionColumnId}
                    </span>
                </ChartResult>

                <div data-stack="v" data-gap="sm">
                    <label className={styles['control']}>
                        <span>Chart name</span>
                        <input
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
                            disabled={createChartState.isLoading}
                            onClick={() => void handleSave()}
                        >
                            <Save size={18} />
                            {createChartState.isLoading ? 'Saving...' : 'Save chart'}
                        </Button>
                        <ButtonLink to="/charts">
                            <FolderKanban size={18} />
                            Open charts
                        </ButtonLink>
                    </div>

                    {chartError && (
                        <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                            {chartError}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className={styles['chart-builder']} aria-label="Chart builder">
            <div data-stack="h" data-gap="sm" data-align="center">
                <ChartNoAxesColumnIncreasing size={20} />
                <span className={styles['eyebrow']}>Chart builder</span>
            </div>

            <form className={styles['chart-form']} onSubmit={handlePreview}>
                <label className={styles['control']}>
                    <span>Name</span>
                    <input
                        value={chartName}
                        placeholder={`${selectedDataset.dataset.name} chart`}
                        onChange={event => setChartName(event.target.value)}
                    />
                </label>

                <label className={styles['control']}>
                    <span>Type</span>
                    <select
                        value={chartType}
                        onChange={event => setChartType(event.target.value as ChartType)}
                    >
                        {chartTypes.map(type => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles['control']}>
                    <span>
                        {chartType === 'pie'
                            ? 'Slice'
                            : chartType === 'heatmap'
                              ? 'X dimension'
                              : 'Dimension'}
                    </span>
                    <select
                        value={activeDimensionColumnId}
                        onChange={event => setDimensionColumnId(event.target.value)}
                    >
                        {columns.map(column => (
                            <option key={column.id} value={column.id}>
                                {column.displayName}
                            </option>
                        ))}
                    </select>
                </label>

                {chartType === 'heatmap' && (
                    <label className={styles['control']}>
                        <span>Y dimension</span>
                        <select
                            value={activeHeatmapYColumnId}
                            onChange={event => setHeatmapYColumnId(event.target.value)}
                        >
                            {columns.map(column => (
                                <option key={column.id} value={column.id}>
                                    {column.displayName}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label className={styles['control']}>
                    <span>X grouping</span>
                    <select
                        value={dimensionGroupingMode}
                        onChange={event =>
                            setDimensionGroupingMode(event.target.value as GroupingMode)
                        }
                    >
                        <option value="none">none</option>
                        <option value="time">time</option>
                        <option value="numeric">numeric</option>
                    </select>
                </label>

                {dimensionGroupingMode === 'time' && (
                    <label className={styles['control']}>
                        <span>X grain</span>
                        <select
                            value={dimensionGranularity}
                            onChange={event =>
                                setDimensionGranularity(
                                    event.target.value as TimeGranularity
                                )
                            }
                        >
                            {timeGranularities.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {dimensionGroupingMode === 'numeric' && (
                    <label className={styles['control']}>
                        <span>X step</span>
                        <input
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
                        <span>Y grouping</span>
                        <select
                            value={heatmapYGroupingMode}
                            onChange={event =>
                                setHeatmapYGroupingMode(
                                    event.target.value as GroupingMode
                                )
                            }
                        >
                            <option value="none">none</option>
                            <option value="time">time</option>
                            <option value="numeric">numeric</option>
                        </select>
                    </label>
                )}

                {chartType === 'heatmap' && heatmapYGroupingMode === 'time' && (
                    <label className={styles['control']}>
                        <span>Y grain</span>
                        <select
                            value={heatmapYGranularity}
                            onChange={event =>
                                setHeatmapYGranularity(
                                    event.target.value as TimeGranularity
                                )
                            }
                        >
                            {timeGranularities.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {chartType === 'heatmap' && heatmapYGroupingMode === 'numeric' && (
                    <label className={styles['control']}>
                        <span>Y step</span>
                        <input
                            type="number"
                            min={1}
                            value={heatmapYStep}
                            onChange={event =>
                                setHeatmapYStep(Math.max(1, Number(event.target.value)))
                            }
                        />
                    </label>
                )}

                <label className={styles['control']}>
                    <span>Aggregate</span>
                    <select
                        value={aggregate}
                        onChange={event => setAggregate(event.target.value as Aggregate)}
                    >
                        {aggregates.map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>

                {needsColumn(aggregate) && (
                    <label className={styles['control']}>
                        <span>Measure</span>
                        <select
                            data-testid="primary-measure-select"
                            value={activeMeasureColumnId}
                            onChange={event => setMeasureColumnId(event.target.value)}
                        >
                            {numericColumns.map(column => (
                                <option key={column.id} value={column.id}>
                                    {column.displayName}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {chartType !== 'pie' && chartType !== 'heatmap' && (
                    <label className={styles['control']}>
                        <span>Second measure</span>
                        <select
                            value={secondMeasureEnabled ? 'on' : 'off'}
                            onChange={event =>
                                setSecondMeasureEnabled(event.target.value === 'on')
                            }
                        >
                            <option value="off">off</option>
                            <option value="on">on</option>
                        </select>
                    </label>
                )}

                {secondMeasureEnabled &&
                    chartType !== 'pie' &&
                    chartType !== 'heatmap' && (
                        <>
                            <label className={styles['control']}>
                                <span>Second aggregate</span>
                                <select
                                    value={secondAggregate}
                                    onChange={event =>
                                        setSecondAggregate(
                                            event.target.value as Aggregate
                                        )
                                    }
                                >
                                    {aggregates.map(item => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {needsColumn(secondAggregate) && (
                                <label className={styles['control']}>
                                    <span>Second measure column</span>
                                    <select
                                        data-testid="second-measure-select"
                                        value={activeSecondMeasureColumnId}
                                        onChange={event =>
                                            setSecondMeasureColumnId(event.target.value)
                                        }
                                    >
                                        {numericColumns.map(column => (
                                            <option key={column.id} value={column.id}>
                                                {column.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </>
                    )}

                {chartType !== 'pie' && chartType !== 'heatmap' && (
                    <label className={styles['control']}>
                        <span>Series</span>
                        <select
                            value={seriesEnabled ? 'on' : 'off'}
                            onChange={event =>
                                setSeriesEnabled(event.target.value === 'on')
                            }
                        >
                            <option value="off">off</option>
                            <option value="on">on</option>
                        </select>
                    </label>
                )}

                {seriesEnabled && chartType !== 'pie' && chartType !== 'heatmap' && (
                    <>
                        <label className={styles['control']}>
                            <span>Series column</span>
                            <select
                                value={activeSeriesColumnId}
                                onChange={event => setSeriesColumnId(event.target.value)}
                            >
                                {columns.map(column => (
                                    <option key={column.id} value={column.id}>
                                        {column.displayName}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className={styles['control']}>
                            <span>Series top</span>
                            <input
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
                                <span>Other bucket</span>
                                <select
                                    value={seriesOtherBucket ? 'on' : 'off'}
                                    onChange={event =>
                                        setSeriesOtherBucket(event.target.value === 'on')
                                    }
                                >
                                    <option value="on">on</option>
                                    <option value="off">off</option>
                                </select>
                            </label>
                        )}
                    </>
                )}

                <label className={styles['control']}>
                    <span>Sort</span>
                    <select
                        value={sortDirection}
                        onChange={event =>
                            setSortDirection(event.target.value as 'asc' | 'desc')
                        }
                    >
                        <option value="desc">measure desc</option>
                        <option value="asc">measure asc</option>
                    </select>
                </label>

                <label className={styles['control']}>
                    <span>Limit</span>
                    <input
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
                        <span>Top slices</span>
                        <input
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

                <label className={styles['control']}>
                    <span>Filter</span>
                    <select
                        value={filterEnabled ? 'on' : 'off'}
                        onChange={event => setFilterEnabled(event.target.value === 'on')}
                    >
                        <option value="off">off</option>
                        <option value="on">on</option>
                    </select>
                </label>

                {filterEnabled && (
                    <>
                        <label className={styles['control']}>
                            <span>Filter column</span>
                            <select
                                value={activeFilterColumn?.id ?? ''}
                                onChange={event => setFilterColumnId(event.target.value)}
                            >
                                {columns.map(column => (
                                    <option key={column.id} value={column.id}>
                                        {column.displayName}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className={styles['control']}>
                            <span>Operation</span>
                            <select
                                value={filterOperation}
                                onChange={event =>
                                    setFilterOperation(
                                        event.target.value as FilterOperation
                                    )
                                }
                            >
                                {filterOperations.map(operation => (
                                    <option key={operation} value={operation}>
                                        {operation}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {!nullaryFilter && (
                            <label className={styles['control']}>
                                <span>Value</span>
                                <input
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
                >
                    <Play size={18} />
                    {previewState.isLoading ? 'Loading...' : 'Preview'}
                </Button>
            </form>

            {chartError && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {chartError}
                </div>
            )}
        </section>
    );
};
