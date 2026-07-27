import type { DashboardItem } from '@/core/entities/dashboardItem';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { IconButton, Sheet, Stat, Text } from '@qualification-work/design-system';
import { Pencil, X } from 'lucide-react';

import { Sparkline } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../const';

import { useMeasuredElementSize } from '../../lib';
import { WidgetSourceLabel } from '../WidgetSourceLabel';
import {
    formatMetricValue,
    getMetricTrendDescription,
    getMetricWidgetLayout,
    metricProgress,
    metricTargetDelta,
} from './lib';
import { MetricTrendDescription } from './ui';

import styles from './MetricWidget.module.css';

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
    const { ref, size } = useMeasuredElementSize<HTMLElement>();
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

    const valueContent = (
        <Stat
            data-test-id="dashboard-metric-value"
            label={hasValue ? 'Значение' : 'Нет данных'}
            value={
                hasValue
                    ? formatMetricValue(item.value, item.format, item.valueMultiplier)
                    : '—'
            }
            delta={targetDelta?.label}
            deltaTone={targetDelta?.tone === 'danger' ? 'danger' : undefined}
        />
    );

    return (
        <Sheet
            as="article"
            ref={ref}
            tabIndex={0}
            aria-label={item.name}
            className={styles['metric-card']}
            data-stack="v"
            data-test-id={dashboardsTestIds.metricWidget}
            title={item.name}
        >
            <div className={styles['metric-inner']}>
                <div
                    data-stack="h"
                    data-align="center"
                    data-justify="between"
                    data-gap="xs"
                >
                    <Text
                        as="h3"
                        variant="body-sm"
                        className={styles['metric-title']}
                        title={item.name}
                    >
                        {item.name}
                    </Text>
                    <div data-stack="h" data-align="center" data-gap="xs">
                        <IconButton
                            variant="ghost"
                            aria-label={`Изменить ${item.name}`}
                            onClick={() => onEditItem(item)}
                        >
                            <Pencil size={14} />
                        </IconButton>
                        <IconButton
                            variant="ghost"
                            aria-label={`Удалить ${item.name}`}
                            disabled={removing}
                            onClick={() => onRemoveItem(item.id)}
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
                            className={styles['progress-row']}
                            data-stack="h"
                            data-align="center"
                            data-gap="xs"
                        >
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
                            <Text
                                as="span"
                                variant="data"
                                tone="mutedCanvas"
                                className={styles['progress-target']}
                                title="Цель"
                            >
                                {formatMetricValue(
                                    item.target,
                                    item.format,
                                    item.valueMultiplier
                                )}
                            </Text>
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
        </Sheet>
    );
};
