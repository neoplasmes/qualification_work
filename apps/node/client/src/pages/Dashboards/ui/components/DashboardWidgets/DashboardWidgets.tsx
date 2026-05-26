import { X } from 'lucide-react';
import { useMemo } from 'react';

import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';

import { Card, EmptyState, IconButton } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';
import { splitDashboardItems } from '../../../lib';

import { DashboardChartCard } from '../DashboardChartCard';
import { formatMetricValue } from './lib';

import styles from './DashboardWidgets.module.scss';

type DashboardWidgetsProps = {
    items: DashboardItem[];
    chartsById: Map<string, Chart>;
    reorderLoading: boolean;
    removing: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
    onRemoveItem: (itemId: string) => void;
};

export const DashboardWidgets = ({
    items,
    chartsById,
    reorderLoading,
    removing,
    onMoveItem,
    onRemoveItem,
}: DashboardWidgetsProps) => {
    const { metricItems, chartItems } = useMemo(
        () => splitDashboardItems(items),
        [items]
    );

    return (
        <div
            className={styles['grid']}
            data-test-id={dashboardsTestIds.widgetList}
            aria-label="Dashboard widgets"
        >
            {items.length === 0 && (
                <EmptyState>Add a saved chart to this dashboard.</EmptyState>
            )}

            {metricItems.length > 0 && (
                <div className={styles['metrics']}>
                    <h3 className={styles['metrics-title']}>Metrics</h3>
                    <div className={styles['metrics-list']}>
                        {metricItems.map(item => (
                            <MetricWidget
                                key={item.id}
                                item={item}
                                removing={removing}
                                onRemoveItem={onRemoveItem}
                            />
                        ))}
                    </div>
                </div>
            )}

            {chartItems.length > 0 && (
                <div className={styles['charts']}>
                    {chartItems.map((item, index) => (
                        <ChartWidget
                            key={item.id}
                            item={item}
                            index={index}
                            itemsCount={chartItems.length}
                            chart={chartsById.get(item.chartId)}
                            reorderLoading={reorderLoading}
                            removing={removing}
                            onMoveItem={onMoveItem}
                            onRemoveItem={onRemoveItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

type WidgetCommonProps = {
    index: number;
    itemsCount: number;
    reorderLoading: boolean;
    removing: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
    onRemoveItem: (itemId: string) => void;
};

type ChartWidgetProps = WidgetCommonProps & {
    item: Extract<DashboardItem, { kind: 'chart' }>;
    chart: Chart | undefined;
};

const ChartWidget = ({
    item,
    index,
    itemsCount,
    chart,
    reorderLoading,
    removing,
    onMoveItem,
    onRemoveItem,
}: ChartWidgetProps) => (
    <DashboardChartCard
        item={item}
        chart={chart}
        index={index}
        itemsCount={itemsCount}
        reorderLoading={reorderLoading}
        removing={removing}
        onMoveItem={onMoveItem}
        onRemove={onRemoveItem}
        data-test-id={dashboardsTestIds.chartWidget}
    />
);

type MetricWidgetProps = {
    item: Extract<DashboardItem, { kind: 'metric' }>;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
};

const MetricWidget = ({ item, removing, onRemoveItem }: MetricWidgetProps) => (
    <Card
        as="article"
        className={styles['metric-card']}
        data-test-id={dashboardsTestIds.metricWidget}
    >
        <h3 className={styles['metric-title']}>{item.name}</h3>
        <strong className={styles['metric-value']}>
            {formatMetricValue(item.value, item.format)}
        </strong>
        <IconButton
            tone="plain"
            iconStrokeWidth={2.6}
            className={styles['metric-remove']}
            aria-label={`Remove ${item.name}`}
            disabled={removing}
            onClick={() => onRemoveItem(item.id)}
        >
            <X size={14} />
        </IconButton>
    </Card>
);
