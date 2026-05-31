import { Pencil, X } from 'lucide-react';

import type { DashboardItem } from '@/entities/dashboard';

import { Card, IconButton, Sparkline } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../../const';

import { formatMetricValue, metricProgress, metricTone } from '../../lib';

import styles from './MetricWidget.module.scss';

type MetricWidgetProps = {
    item: Extract<DashboardItem, { kind: 'metric' }>;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
    onEditItem: (item: Extract<DashboardItem, { kind: 'metric' }>) => void;
};

export const MetricWidget = ({
    item,
    removing,
    onRemoveItem,
    onEditItem,
}: MetricWidgetProps) => {
    const hasValue = item.value != null && Number.isFinite(item.value);
    const tone = metricTone(item.value, item.target, item.targetDirection);
    const progress = metricProgress(item.value, item.target, item.targetDirection);
    const trendValues = (item.trend ?? [])
        .map(point => point.value)
        .filter((value): value is number => value != null);

    let valueContent;
    if (hasValue) {
        valueContent = (
            <strong className={`${styles['metric-value']} ${styles[`tone-${tone}`]}`}>
                {formatMetricValue(item.value, item.format)}
            </strong>
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
            <div data-stack="h" data-align="center" data-justify="between" data-gap="xs">
                <h3 className={styles['metric-title']} title={item.name}>
                    {item.name}
                </h3>
                <div data-stack="h" data-align="center" data-gap="xs" data-pr="xs">
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
            >
                {valueContent}

                {progress !== null && (
                    <div className={styles['progress']}>
                        <div
                            className={`${styles['progress-fill']} ${styles[`tone-${tone}`]}`}
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                )}

                {trendValues.length >= 2 && (
                    <Sparkline values={trendValues} className={styles[`tone-${tone}`]} />
                )}
            </div>
        </Card>
    );
};
