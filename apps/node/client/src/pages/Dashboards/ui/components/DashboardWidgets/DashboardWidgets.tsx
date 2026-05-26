import { ArrowDown, ArrowUp, X } from 'lucide-react';

import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';

import { Card, EmptyState, IconButton } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { DashboardChartCard } from '../DashboardChartCard';

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
}: DashboardWidgetsProps) => (
    <div
        className={styles['grid']}
        data-test-id={dashboardsTestIds.widgetList}
        aria-label="Dashboard widgets"
    >
        {items.length === 0 && (
            <EmptyState>Add a saved chart to this dashboard.</EmptyState>
        )}
        {items.map((item, index) =>
            item.kind === 'chart' ? (
                <ChartWidget
                    key={item.id}
                    item={item}
                    index={index}
                    itemsCount={items.length}
                    chart={chartsById.get(item.chartId)}
                    reorderLoading={reorderLoading}
                    removing={removing}
                    onMoveItem={onMoveItem}
                    onRemoveItem={onRemoveItem}
                />
            ) : (
                <MetricWidget
                    key={item.id}
                    item={item}
                    index={index}
                    itemsCount={items.length}
                    reorderLoading={reorderLoading}
                    removing={removing}
                    onMoveItem={onMoveItem}
                    onRemoveItem={onRemoveItem}
                />
            )
        )}
    </div>
);

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
    <div className={styles['widget-wrap']} data-test-id={dashboardsTestIds.chartWidget}>
        <MoveActions
            label={chart?.name ?? item.id}
            itemId={item.id}
            index={index}
            itemsCount={itemsCount}
            disabled={reorderLoading}
            onMoveItem={onMoveItem}
        />
        <DashboardChartCard
            item={item}
            chart={chart}
            removing={removing}
            onRemove={onRemoveItem}
        />
    </div>
);

type MetricWidgetProps = WidgetCommonProps & {
    item: Extract<DashboardItem, { kind: 'metric' }>;
};

const MetricWidget = ({
    item,
    index,
    itemsCount,
    reorderLoading,
    removing,
    onMoveItem,
    onRemoveItem,
}: MetricWidgetProps) => (
    <Card
        as="article"
        className={styles['dashboard-card']}
        data-test-id={dashboardsTestIds.metricWidget}
    >
        <div className={styles['card-header']}>
            <div data-stack="v" data-gap="xs">
                <h3>{item.name}</h3>
                <p>
                    {item.expression} · {item.format}
                </p>
            </div>
            <div data-stack="h" data-gap="xs">
                <MoveActions
                    label={item.name}
                    itemId={item.id}
                    index={index}
                    itemsCount={itemsCount}
                    disabled={reorderLoading}
                    onMoveItem={onMoveItem}
                />
                <IconButton
                    aria-label={`Remove ${item.name}`}
                    disabled={removing}
                    onClick={() => onRemoveItem(item.id)}
                >
                    <X size={17} />
                </IconButton>
            </div>
        </div>
    </Card>
);

type MoveActionsProps = {
    label: string;
    itemId: string;
    index: number;
    itemsCount: number;
    disabled: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
};

const MoveActions = ({
    label,
    itemId,
    index,
    itemsCount,
    disabled,
    onMoveItem,
}: MoveActionsProps) => (
    <div className={styles['widget-actions']}>
        <IconButton
            aria-label={`Move ${label} up`}
            disabled={index === 0 || disabled}
            onClick={() => onMoveItem(itemId, -1)}
        >
            <ArrowUp size={17} />
        </IconButton>
        <IconButton
            aria-label={`Move ${label} down`}
            disabled={index === itemsCount - 1 || disabled}
            onClick={() => onMoveItem(itemId, 1)}
        >
            <ArrowDown size={17} />
        </IconButton>
    </div>
);
