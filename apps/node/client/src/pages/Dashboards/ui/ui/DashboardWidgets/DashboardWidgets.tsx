import { useMemo } from 'react';

import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import { EmptyState } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';
import { splitDashboardItems } from '../../../lib';

import { ChartWidget, MetricWidget } from './ui';

import styles from './DashboardWidgets.module.scss';

type DashboardWidgetsProps = {
    items: DashboardItem[];
    chartsById: Map<string, Chart>;
    datasetColumnsById: Map<string, DatasetColumn[]>;
    reorderLoading: boolean;
    removing: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
    onRemoveItem: (itemId: string) => void;
    onEditMetric: (item: Extract<DashboardItem, { kind: 'metric' }>) => void;
};

export const DashboardWidgets = ({
    items,
    chartsById,
    datasetColumnsById,
    reorderLoading,
    removing,
    onMoveItem,
    onRemoveItem,
    onEditMetric,
}: DashboardWidgetsProps) => {
    const { metricItems, chartItems } = useMemo(
        () => splitDashboardItems(items),
        [items]
    );

    return (
        <div
            className={styles['widgets']}
            data-stack="v"
            data-gap="md"
            data-test-id={dashboardsTestIds.widgetList}
            aria-label="Dashboard widgets"
        >
            {items.length === 0 && (
                <EmptyState>Add a saved chart to this dashboard.</EmptyState>
            )}

            {metricItems.length > 0 && (
                <div
                    className={styles['metrics']}
                    data-stack="v"
                    data-gap="md"
                    data-p="md"
                >
                    <h3 className={styles['metrics-title']}>Metrics</h3>
                    <div
                        data-stack="h"
                        data-gap="md"
                        data-wrap="wrap"
                        data-justify="start"
                    >
                        {metricItems.map(item => (
                            <MetricWidget
                                key={item.id}
                                item={item}
                                removing={removing}
                                onRemoveItem={onRemoveItem}
                                onEditItem={onEditMetric}
                            />
                        ))}
                    </div>
                </div>
            )}

            {chartItems.length > 0 && (
                <div className={styles['charts']} data-display="grid" data-gap="md">
                    {chartItems.map((item, index) => {
                        const chart = chartsById.get(item.chartId);

                        return (
                            <ChartWidget
                                key={item.id}
                                item={item}
                                index={index}
                                itemsCount={chartItems.length}
                                chart={chart}
                                columns={
                                    datasetColumnsById.get(chart?.datasetId ?? '') ?? []
                                }
                                reorderLoading={reorderLoading}
                                removing={removing}
                                onMoveItem={onMoveItem}
                                onRemoveItem={onRemoveItem}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};
