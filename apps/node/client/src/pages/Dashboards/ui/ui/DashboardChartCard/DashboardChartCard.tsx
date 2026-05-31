import { Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router';

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
    showDescription: boolean;
    showAxisTickLabels: boolean;
    onRemove: (itemId: string) => void;
    'data-test-id'?: string;
};

export const DashboardChartCard = ({
    item,
    chart,
    columns,
    removing,
    showDescription,
    showAxisTickLabels,
    onRemove,
    'data-test-id': testId,
}: DashboardChartCardProps) => {
    const navigate = useNavigate();
    const chartDataQuery = useGetChartDataQuery(item.chartId);
    const chartName = chart?.name ?? item.chartId;
    const handleEdit = () => {
        navigate(`/charts/edit?id=${encodeURIComponent(item.chartId)}`);
    };

    return (
        <Card
            as="article"
            className={styles['dashboard-card']}
            data-stack="v"
            data-gap="md"
            data-p="sm-plus"
            data-test-id={testId}
        >
            <div
                className={styles['card-header']}
                data-stack="h"
                data-gap="md"
                data-align="center"
                data-justify="between"
            >
                <div data-stack="v" data-gap="xs">
                    <h3>{chart?.name ?? `Chart ${item.chartId.slice(0, 8)}`}</h3>
                </div>
                <div data-stack="h" data-gap="xs" className={styles['card-actions']}>
                    <IconButton
                        tone="plain"
                        data-p="none"
                        iconStrokeWidth={2.6}
                        aria-label={`Edit ${chartName}`}
                        onClick={handleEdit}
                    >
                        <Pencil size={14} />
                    </IconButton>
                    <IconButton
                        tone="plain"
                        data-p="none"
                        iconStrokeWidth={2.6}
                        aria-label={`Remove ${chartName}`}
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
                <div className={styles['chart-area']}>
                    <ChartCard
                        chart={chart}
                        columns={columns}
                        data={chartDataQuery.data}
                        ariaLabel={`${chart?.name ?? item.chartId} dashboard chart`}
                        chartHeight="fill"
                        descriptionSize="small"
                        showDescription={showDescription}
                        showAxisTickLabels={showAxisTickLabels}
                        showLegend={false}
                    />
                </div>
            )}
        </Card>
    );
};
