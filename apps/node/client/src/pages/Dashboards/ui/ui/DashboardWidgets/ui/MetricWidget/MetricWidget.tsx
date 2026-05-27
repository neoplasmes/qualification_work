import { Pencil, X } from 'lucide-react';

import type { DashboardItem } from '@/entities/dashboard';

import { Card, IconButton } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../../const';

import { formatMetricValue } from '../../lib';

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
}: MetricWidgetProps) => (
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
        <div data-stack="v" data-align="center" data-justify="center" data-grow>
            <strong className={styles['metric-value']}>
                {formatMetricValue(item.value, item.format)}
            </strong>
        </div>
    </Card>
);
