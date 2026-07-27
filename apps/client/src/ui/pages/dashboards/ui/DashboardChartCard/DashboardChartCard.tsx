import type { Chart } from '@/core/entities/chart';
import type { DashboardChartItem } from '@/core/entities/dashboardItem';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { ChartCard } from '@/ui/pages/dashboards/ui/ChartCard';
import {
    Divider,
    IconButton,
    Link,
    Sheet,
    Text,
} from '@qualification-work/design-system';
import { X } from 'lucide-react';
import { Link as RouterLink } from 'react-router';

import { StatusMessage } from '@/shared/ui';

import { useMeasuredElementSize } from '../DashboardWidgets/lib';
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
    const { ref: chartAreaRef, size: chartArea } =
        useMeasuredElementSize<HTMLDivElement>();
    const showLegend = chartArea.width >= 300 && chartArea.height >= 200;

    const chartDataQuery = useRead(
        useDependencies().getChartData,
        { orgId: chart?.orgId ?? '', chartId: item.chartId },
        { enabled: Boolean(chart?.orgId) }
    );
    const chartData = chartDataQuery.data ?? null;
    const isLoadingChartData =
        !chartData && (chartDataQuery.isPending || chartDataQuery.isFetching);
    const chartName = chart?.name ?? item.chartId;

    return (
        <Sheet
            as="article"
            tabIndex={0}
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
                    <Text as="h3" variant="heading-sm">
                        {chart?.name ?? `График ${item.chartId.slice(0, 8)}`}
                    </Text>
                </div>
                <div data-stack="h" data-gap="xs" className={styles['card-actions']}>
                    <Link
                        as={RouterLink}
                        to={`/charts/edit?id=${encodeURIComponent(item.chartId)}`}
                        aria-label={`Изменить ${chartName}`}
                    >
                        Открыть
                    </Link>
                    <IconButton
                        variant="ghost"
                        data-p="none"
                        aria-label={`Удалить ${chartName}`}
                        disabled={removing}
                        onClick={() => onRemove(item.id)}
                    >
                        <X size={20} />
                    </IconButton>
                </div>
            </div>

            <Divider />

            {isLoadingChartData && (
                <StatusMessage>Загружаем данные графика…</StatusMessage>
            )}

            {Boolean(chartDataQuery.error) && !chartData && (
                <StatusMessage tone="error">
                    Не удалось загрузить данные графика.
                </StatusMessage>
            )}

            {chartData && (
                <div ref={chartAreaRef} className={styles['chart-area']}>
                    <ChartCard
                        chart={chart}
                        columns={columns}
                        data={chartData}
                        ariaLabel={`${chart?.name ?? item.chartId}: график дашборда`}
                        chartHeight="fill"
                        descriptionSize="small"
                        constrainAspectRatio
                        showDescription={showDescription}
                        showAxisTickLabels={showAxisTickLabels}
                        showLegend={showLegend}
                    />
                </div>
            )}

            <WidgetSourceLabel sourceName={sourceName} />
        </Sheet>
    );
};
