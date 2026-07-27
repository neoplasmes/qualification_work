import type {
    Aggregate,
    ChartType,
    FilterClause,
    FilterOperation,
} from '@/core/entities/chart';
import {
    aggregateLabels,
    filterOpShort,
    granularityLabels,
} from '@/ui/widgets/ChartShell';
import { Fragment, type ReactNode } from 'react';

import styles from './chartConfigSummary.widget.module.css';

type Props = {
    chartType: ChartType;
    config: Record<string, unknown>;
    columns: readonly ChartSummaryColumn[];
    className?: string;
    size?: 'default' | 'small';
};

type ChartSummaryColumn = {
    id: string;
    displayName: string;
};

type MeasureLike = {
    aggregate?: Aggregate;
    columnId?: string;
};

type AxisLike = {
    columnId?: string;
    grouping?: { kind?: string; granularity?: string; step?: number } | null;
};

type SeriesLike = {
    columnId?: string;
    topN?: number;
    otherBucket?: boolean;
};

type SliceLike = {
    columnId?: string;
    topN?: number;
};

export const ChartConfigSummary = ({
    chartType,
    config,
    columns,
    className,
    size = 'default',
}: Props) => {
    const colName = (id: string | undefined): string => {
        if (!id) {
            return '?';
        }

        return columns.find(c => c.id === id)?.displayName ?? id;
    };

    const Col = ({ id }: { id: string | undefined }) => (
        <span className={styles['col']}>{colName(id)}</span>
    );

    const Val = ({ children }: { children: ReactNode }) => (
        <span className={styles['val']}>{children}</span>
    );

    const renderMeasure = (m: MeasureLike | undefined): ReactNode => {
        const agg = m?.aggregate;
        const label = agg ? (aggregateLabels[agg] ?? agg) : '?';
        if (agg === 'count') {
            return (
                <>
                    <strong>{label}</strong> строк
                </>
            );
        }

        return (
            <>
                <strong>{label}</strong> поля <Col id={m?.columnId} />
            </>
        );
    };

    const renderGrouping = (grouping: AxisLike['grouping']): ReactNode => {
        if (!grouping || !grouping.kind) {
            return null;
        }

        if (grouping.kind === 'time' && grouping.granularity) {
            const label =
                granularityLabels[
                    grouping.granularity as keyof typeof granularityLabels
                ] ?? grouping.granularity;

            return (
                <>
                    {' '}
                    (период: <Val>{label.toLowerCase()}</Val>)
                </>
            );
        }

        if (grouping.kind === 'numeric' && typeof grouping.step === 'number') {
            return (
                <>
                    {' '}
                    (шаг <Val>{grouping.step}</Val>)
                </>
            );
        }

        return null;
    };

    const renderFilterValue = (op: FilterOperation, value: unknown): ReactNode => {
        if (op === 'is_null' || op === 'not_null') {
            return null;
        }

        if (op === 'between' && Array.isArray(value)) {
            return (
                <>
                    <Val>{String(value[0] ?? '')}</Val> и{' '}
                    <Val>{String(value[1] ?? '')}</Val>
                </>
            );
        }

        if ((op === 'in' || op === 'nin') && Array.isArray(value)) {
            return <Val>{value.map(v => String(v)).join(', ')}</Val>;
        }

        return <Val>{String(value ?? '')}</Val>;
    };

    const renderFilters = (filters: FilterClause[] | undefined): ReactNode => {
        if (!filters || filters.length === 0) {
            return null;
        }

        return (
            <>
                , условие:{' '}
                {filters.map((f, i) => (
                    <Fragment key={`${f.columnId}-${i}`}>
                        {i > 0 && ' и '}
                        <Col id={f.columnId} />{' '}
                        <strong>{filterOpShort[f.op] ?? f.op}</strong>
                        {(() => {
                            const rendered = renderFilterValue(f.op, f.value);

                            return rendered ? <> {rendered}</> : null;
                        })()}
                    </Fragment>
                ))}
            </>
        );
    };

    const renderBody = (): ReactNode => {
        const filters = config.filters as FilterClause[] | undefined;

        if (chartType === 'pie') {
            const slice = (config.slice ?? {}) as SliceLike;
            const measure = config.measure as MeasureLike | undefined;

            return (
                <>
                    <strong>Круговая диаграмма</strong> по полю{' '}
                    <Col id={slice.columnId} />, показатель: {renderMeasure(measure)}
                    {typeof slice.topN === 'number' && (
                        <>
                            , первые <Val>{slice.topN}</Val> секторов
                        </>
                    )}
                    {renderFilters(filters)}.
                </>
            );
        }

        if (chartType === 'heatmap') {
            const x = (config.x ?? {}) as AxisLike;
            const y = (config.y ?? {}) as AxisLike;
            const measure = config.measure as MeasureLike | undefined;

            return (
                <>
                    <strong>Тепловая карта</strong>: {renderMeasure(measure)} по{' '}
                    <Col id={x.columnId} />
                    {renderGrouping(x.grouping)} × <Col id={y.columnId} />
                    {renderGrouping(y.grouping)}
                    {renderFilters(filters)}.
                </>
            );
        }

        // bar / line
        const dim = (config.dimension ?? {}) as AxisLike;
        const series = config.series as SeriesLike | undefined;
        const measures = (config.measures as MeasureLike[] | undefined) ?? [];
        const isBar = chartType === 'bar';
        const typeLabel = isBar ? 'Столбцы' : 'Линия';

        return (
            <>
                <strong>{typeLabel}</strong>:{' '}
                {measures.map((m, i) => (
                    <Fragment key={i}>
                        {i > 0 && ' и '}
                        {renderMeasure(m)}
                    </Fragment>
                ))}{' '}
                по полю <Col id={dim.columnId} />
                {renderGrouping(dim.grouping)}
                {series && series.columnId && (
                    <>
                        , разбиение по <Col id={series.columnId} />
                        {typeof series.topN === 'number' && (
                            <>
                                {' '}
                                (первые <Val>{series.topN}</Val>
                                {series.otherBucket && ', остальные объединены'})
                            </>
                        )}
                    </>
                )}
                {renderFilters(filters)}.
            </>
        );
    };

    const classNames = [
        styles['summary'],
        size === 'small' ? styles['small'] : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <p className={classNames}>{renderBody()}</p>;
};
