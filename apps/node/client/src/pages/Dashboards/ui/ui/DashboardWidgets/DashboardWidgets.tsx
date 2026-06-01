import 'gridstack/dist/gridstack.min.css';

import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';

import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import { EmptyState } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { useDashboardGrid, type DashboardGridItem } from './lib';
import { ChartWidget, MetricWidget } from './ui';

import styles from './DashboardWidgets.module.scss';

type DashboardWidgetsProps = {
    items: DashboardItem[];
    chartsById: Map<string, Chart>;
    datasetColumnsById: Map<string, DatasetColumn[]>;
    datasetNamesById: Map<string, string>;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
    onEditMetric: (item: Extract<DashboardItem, { kind: 'metric' }>) => void;
    onLayoutChange: (layout: DashboardItemLayoutInput[]) => void;
};

const toGridItem = (item: DashboardItem): DashboardGridItem => {
    const minW =
        item.kind === 'metric' ? dashboardMetricMinWidth : dashboardChartMinWidth;
    const minH =
        item.kind === 'metric' ? dashboardMetricMinHeight : dashboardChartMinHeight;

    return {
        id: item.id,
        x: item.layout.posX,
        y: item.layout.posY,
        w: item.layout.width,
        h: item.layout.height,
        minW,
        minH,
    };
};

export const DashboardWidgets = ({
    items,
    chartsById,
    datasetColumnsById,
    datasetNamesById,
    removing,
    onRemoveItem,
    onEditMetric,
    onLayoutChange,
}: DashboardWidgetsProps) => {
    const gridItems = useMemo(() => items.map(toGridItem), [items]);
    const itemsById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

    const { containerRef, hosts } = useDashboardGrid(gridItems, onLayoutChange);

    const renderItem = (item: DashboardItem) => {
        if (item.kind === 'metric') {
            return (
                <MetricWidget
                    item={item}
                    columns={datasetColumnsById.get(item.datasetId) ?? []}
                    sourceName={datasetNamesById.get(item.datasetId)}
                    removing={removing}
                    onRemoveItem={onRemoveItem}
                    onEditItem={onEditMetric}
                />
            );
        }

        const chart = chartsById.get(item.chartId);

        return (
            <ChartWidget
                item={item}
                chart={chart}
                columns={datasetColumnsById.get(chart?.datasetId ?? '') ?? []}
                sourceName={
                    chart
                        ? (datasetNamesById.get(chart.datasetId) ?? chart.datasetId)
                        : undefined
                }
                removing={removing}
                onRemoveItem={onRemoveItem}
            />
        );
    };

    return (
        <div
            className={styles['widgets']}
            data-test-id={dashboardsTestIds.widgetList}
            aria-label="Dashboard widgets"
        >
            {items.length === 0 && (
                <EmptyState>Add a saved chart to this dashboard.</EmptyState>
            )}

            <div ref={containerRef} className={`grid-stack ${styles['grid']}`} />
            {[...hosts].map(([id, host]) => {
                const item = itemsById.get(id);

                return item ? createPortal(renderItem(item), host, id) : null;
            })}
        </div>
    );
};
