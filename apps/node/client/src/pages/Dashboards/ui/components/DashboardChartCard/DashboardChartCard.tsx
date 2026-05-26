import { ArrowDown, ArrowUp, X } from 'lucide-react';

import { ChartResult, useGetChartDataQuery, type Chart } from '@/entities/chart';
import type { DashboardChartItem } from '@/entities/dashboard';

import { Card, IconButton, StatusMessage } from '@/shared/ui';

import styles from './DashboardChartCard.module.scss';

type DashboardChartCardProps = {
    item: DashboardChartItem;
    chart: Chart | undefined;
    index: number;
    itemsCount: number;
    reorderLoading: boolean;
    removing: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
    onRemove: (itemId: string) => void;
    'data-test-id'?: string;
};

export const DashboardChartCard = ({
    item,
    chart,
    index,
    itemsCount,
    reorderLoading,
    removing,
    onMoveItem,
    onRemove,
    'data-test-id': testId,
}: DashboardChartCardProps) => {
    const chartDataQuery = useGetChartDataQuery(item.chartId);

    return (
        <Card as="article" className={styles['dashboard-card']} data-test-id={testId}>
            <div className={styles['card-header']}>
                <div data-stack="v" data-gap="xs">
                    <h3>{chart?.name ?? `Chart ${item.chartId.slice(0, 8)}`}</h3>
                </div>
                <div data-stack="h" data-gap="xs">
                    <IconButton
                        tone="plain"
                        iconStrokeWidth={2.6}
                        aria-label={`Move ${chart?.name ?? item.chartId} up`}
                        disabled={index === 0 || reorderLoading}
                        onClick={() => onMoveItem(item.id, -1)}
                    >
                        <ArrowUp size={17} />
                    </IconButton>
                    <IconButton
                        tone="plain"
                        iconStrokeWidth={2.6}
                        aria-label={`Move ${chart?.name ?? item.chartId} down`}
                        disabled={index === itemsCount - 1 || reorderLoading}
                        onClick={() => onMoveItem(item.id, 1)}
                    >
                        <ArrowDown size={17} />
                    </IconButton>
                    <IconButton
                        tone="plain"
                        iconStrokeWidth={2.6}
                        aria-label={`Remove ${chart?.name ?? item.chartId}`}
                        disabled={removing}
                        onClick={() => onRemove(item.id)}
                    >
                        <X size={17} />
                    </IconButton>
                </div>
            </div>

            {chartDataQuery.isLoading && (
                <StatusMessage>Loading chart data...</StatusMessage>
            )}

            {chartDataQuery.data && (
                <ChartResult
                    data={chartDataQuery.data}
                    kind={chartDataQuery.data.kind}
                    ariaLabel={`${chart?.name ?? item.chartId} dashboard chart`}
                    barsLimit={6}
                    hideTable
                    frameless
                />
            )}
        </Card>
    );
};
