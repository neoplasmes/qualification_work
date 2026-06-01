import { Pencil, X } from 'lucide-react';

import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import { Card, IconButton, Separator, Sparkline } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../../const';

import {
    formatMetricValue,
    metricProgress,
    metricTargetDelta,
    useMeasuredElementSize,
} from '../../lib';
import { WidgetSourceLabel } from '../WidgetSourceLabel';
import { getMetricTrendDescription, getMetricWidgetLayout } from './lib';
import { MetricTrendDescription } from './ui';

import styles from './MetricWidget.module.scss';

type MetricWidgetProps = {
    item: Extract<DashboardItem, { kind: 'metric' }>;
    columns: DatasetColumn[];
    sourceName?: string;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
    onEditItem: (item: Extract<DashboardItem, { kind: 'metric' }>) => void;
};

export const MetricWidget = ({
    item,
    columns,
    sourceName,
    removing,
    onRemoveItem,
    onEditItem,
}: MetricWidgetProps) => {
    const { ref, size } = useMeasuredElementSize<HTMLDivElement>();
    const layout = getMetricWidgetLayout(size);
    const hasValue = item.value != null && Number.isFinite(item.value);
    const progress = metricProgress(item.value, item.target, item.targetDirection);
    const targetDelta = metricTargetDelta(item.value, item.target, item.targetDirection);
    const trendValues = (item.trend ?? [])
        .map(point => point.value)
        .filter((value): value is number => value != null);
    const hasSparkline = item.showTrend && trendValues.length >= 2;
    const showSparkline = hasSparkline && !layout.useProgressFallback;
    const trendDescription = getMetricTrendDescription(item, columns);
    const showProgress =
        progress !== null && (!hasSparkline || layout.useProgressFallback);
    const progressValue = showProgress ? progress : null;

    let valueContent;
    if (hasValue) {
        valueContent = (
            <div className={styles['metric-value-row']}>
                <strong className={styles['metric-value']}>
                    {formatMetricValue(item.value, item.format, item.valueMultiplier)}
                </strong>
                <Separator orientation="vertical" />
                {targetDelta && (
                    <span
                        className={[
                            styles['target-delta'],
                            styles[`delta-${targetDelta.tone}`],
                        ].join(' ')}
                        title="Difference from target"
                    >
                        {targetDelta.label}
                    </span>
                )}
            </div>
        );
    } else {
        valueContent = (
            <span className={styles['metric-empty']} title="This metric has no value yet">
                No data
            </span>
        );
    }

    return (
        <Card
            as="article"
            className={styles['metric-card']}
            data-stack="v"
            data-test-id={dashboardsTestIds.metricWidget}
            title={item.name}
        >
            <div ref={ref} className={styles['metric-inner']}>
                <div
                    data-stack="h"
                    data-align="center"
                    data-justify="between"
                    data-gap="xs"
                >
                    <h3 className={styles['metric-title']} title={item.name}>
                        {item.name}
                    </h3>
                    <div data-stack="h" data-align="center" data-gap="xs">
                        <IconButton
                            tone="plain"
                            iconStrokeWidth={2.5}
                            aria-label={`Edit ${item.name}`}
                            onClick={() => onEditItem(item)}
                            style={{ padding: '0px' }}
                        >
                            <Pencil size={14} />
                        </IconButton>
                        <IconButton
                            tone="plain"
                            iconStrokeWidth={3}
                            aria-label={`Remove ${item.name}`}
                            disabled={removing}
                            onClick={() => onRemoveItem(item.id)}
                            style={{ padding: '0px' }}
                        >
                            <X size={17} />
                        </IconButton>
                    </div>
                </div>
                <div
                    data-stack="v"
                    data-align="center"
                    data-justify="center"
                    data-gap="xs"
                    data-grow
                    className={styles['metric-body']}
                >
                    {valueContent}

                    {progressValue !== null && (
                        <div
                            className={styles['progress']}
                            role="meter"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progressValue * 100)}
                        >
                            <div
                                className={styles['progress-fill']}
                                style={{ width: `${progressValue * 100}%` }}
                            />
                        </div>
                    )}

                    {showSparkline && (
                        <div
                            className={styles['sparkline-block']}
                            data-stack="v"
                            data-align="center"
                            data-gap="md"
                        >
                            <Sparkline
                                values={trendValues}
                                height={layout.sparklineHeight}
                                insetX={12}
                                insetY={4}
                                strokeWidth={2}
                                className={styles['sparkline']}
                            />
                            {layout.showSparklineDescription && trendDescription && (
                                <MetricTrendDescription
                                    columnName={trendDescription.columnName}
                                    timeBucket={trendDescription.timeBucket}
                                />
                            )}
                        </div>
                    )}
                </div>
                <WidgetSourceLabel sourceName={sourceName} />
            </div>
        </Card>
    );
};
