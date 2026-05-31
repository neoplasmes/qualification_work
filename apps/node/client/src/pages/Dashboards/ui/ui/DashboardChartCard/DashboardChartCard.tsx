import { X } from 'lucide-react';

import { ChartCard, useGetChartDataQuery, type Chart } from '@/entities/chart';
import type { DashboardChartItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import { Card, IconButton, StatusMessage } from '@/shared/ui';

import styles from './DashboardChartCard.module.scss';

type DashboardChartCardProps = {
    item: DashboardChartItem;
    chart: Chart | undefined;
    columns: DatasetColumn[];
    removing: boolean;
    onRemove: (itemId: string) => void;
    'data-test-id'?: string;
};

export const DashboardChartCard = ({
    item,
    chart,
    columns,
    removing,
    onRemove,
    'data-test-id': testId,
}: DashboardChartCardProps) => {
    const chartDataQuery = useGetChartDataQuery(item.chartId);

    return (
        <Card
            as="article"
            className={styles['dashboard-card']}
            data-stack="v"
            data-gap="md"
            data-p="md"
            data-test-id={testId}
        >
            <div data-stack="h" data-gap="md" data-align="center" data-justify="between">
                <div data-stack="v" data-gap="xs">
                    <h3>{chart?.name ?? `Chart ${item.chartId.slice(0, 8)}`}</h3>
                </div>
                <div data-stack="h" className={styles['card-actions']}>
                    <IconButton
                        tone="plain"
                        data-p="none"
                        iconStrokeWidth={2.6}
                        aria-label={`Remove ${chart?.name ?? item.chartId}`}
                        disabled={removing}
                        onClick={() => onRemove(item.id)}
                    >
                        <X size={20} />
                    </IconButton>
                </div>
            </div>

            {chartDataQuery.isLoading && (
                <StatusMessage>Loading chart data...</StatusMessage>
            )}

            {chartDataQuery.data && (
                <ChartCard
                    chart={chart}
                    columns={columns}
                    data={chartDataQuery.data}
                    ariaLabel={`${chart?.name ?? item.chartId} dashboard chart`}
                />
            )}
        </Card>
    );
};
