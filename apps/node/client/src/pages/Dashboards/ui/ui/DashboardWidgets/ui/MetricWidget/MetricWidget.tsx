import { X } from 'lucide-react';

import type { DashboardItem } from '@/entities/dashboard';

import { Card, IconButton } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../../const';

import { formatMetricValue } from '../../lib';

import styles from './MetricWidget.module.scss';

type MetricWidgetProps = {
    item: Extract<DashboardItem, { kind: 'metric' }>;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
};

export const MetricWidget = ({ item, removing, onRemoveItem }: MetricWidgetProps) => (
    <Card
        as="article"
        className={styles['metric-card']}
        data-stack="v"
        data-test-id={dashboardsTestIds.metricWidget}
    >
        <div data-stack="h" data-align="center" data-justify="between">
            <h3 className={styles['metric-title']}>{item.name}</h3>
            <IconButton
                tone="plain"
                iconPadding="xs"
                iconStrokeWidth={3}
                aria-label={`Remove ${item.name}`}
                disabled={removing}
                onClick={() => onRemoveItem(item.id)}
            >
                <X size={14} />
            </IconButton>
        </div>
        <div data-stack="v" data-align="center" data-justify="center" data-grow>
            <strong className={styles['metric-value']}>
                {formatMetricValue(item.value, item.format)}
            </strong>
        </div>
    </Card>
);
