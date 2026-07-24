import type { Chart } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { ChartCard } from '@/ui/pages/dashboards/ui/ChartCard';
import { IconButton } from '@qualification-work/design-system';
import { Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router';

import type { DashboardChartItem } from '@/entities/dashboard';

import { Card, StatusMessage } from '@/shared/ui';

import { WidgetSourceLabel } from '../DashboardWidgets/ui/WidgetSourceLabel';

import styles from './DashboardChartCard.module.css';

type DashboardChartCardProps = {
    item: DashboardChartItem;
    chart: Chart | undefined;
    columns: DatasetColumn[];
    removing: boolean;
    sourceName?: string;
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
    sourceName,
    showDescription,
    showAxisTickLabels,
    onRemove,
    'data-test-id': testId,
}: DashboardChartCardProps) => {
    const navigate = useNavigate();
    const chartDataQuery = useRead(
        useDependencies().getChartData,
        { orgId: chart?.orgId ?? '', chartId: item.chartId },
        { enabled: Boolean(chart?.orgId) }
    );
    const chartData = chartDataQuery.data ?? null;
    const isLoadingChartData =
        !chartData && (chartDataQuery.isPending || chartDataQuery.isFetching);
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
                        variant="ghost"
                        data-p="none"
                        aria-label={`Edit ${chartName}`}
                        onClick={handleEdit}
                    >
                        <Pencil size={14} />
                    </IconButton>
                    <IconButton
                        variant="ghost"
                        data-p="none"
                        aria-label={`Remove ${chartName}`}
                        disabled={removing}
                        onClick={() => onRemove(item.id)}
                    >
                        <X size={20} />
                    </IconButton>
                </div>
            </div>

            {isLoadingChartData && <StatusMessage>Loading chart data...</StatusMessage>}

            {Boolean(chartDataQuery.error) && !chartData && (
                <StatusMessage tone="error">Unable to load chart data.</StatusMessage>
            )}

            {chartData && (
                <div className={styles['chart-area']}>
                    <ChartCard
                        chart={chart}
                        columns={columns}
                        data={chartData}
                        ariaLabel={`${chart?.name ?? item.chartId} dashboard chart`}
                        chartHeight="fill"
                        descriptionSize="small"
                        constrainAspectRatio
                        showDescription={showDescription}
                        showAxisTickLabels={showAxisTickLabels}
                        showLegend={false}
                    />
                </div>
            )}

            <WidgetSourceLabel sourceName={sourceName} />
        </Card>
    );
};
