import { RefreshCcw, X } from 'lucide-react';

import { ChartResult, useLazyGetChartDataQuery, type Chart } from '@/entities/chart';
import type { DashboardChartItem } from '@/entities/dashboard';

import { Button, IconButton } from '@/shared/ui';

import styles from './DashboardChartCard.module.scss';

type DashboardChartCardProps = {
    item: DashboardChartItem;
    chart: Chart | undefined;
    removing: boolean;
    onRemove: (itemId: string) => void;
};

export const DashboardChartCard = ({
    item,
    chart,
    removing,
    onRemove,
}: DashboardChartCardProps) => {
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();

    const loadChartData = () => {
        void getChartData(item.chartId, false);
    };

    return (
        <article className={styles['dashboard-card']}>
            <div className={styles['card-header']}>
                <div data-stack="v" data-gap="xs">
                    <h3>{chart?.name ?? `Chart ${item.chartId.slice(0, 8)}`}</h3>
                    <p>{chart?.chartType ?? 'chart'} widget</p>
                </div>
                <div data-stack="h" data-gap="xs">
                    <IconButton
                        aria-label={`Refresh ${chart?.name ?? item.chartId}`}
                        disabled={chartDataQuery.isFetching}
                        onClick={loadChartData}
                    >
                        <RefreshCcw size={17} />
                    </IconButton>
                    <IconButton
                        aria-label={`Remove ${chart?.name ?? item.chartId}`}
                        disabled={removing}
                        onClick={() => onRemove(item.id)}
                    >
                        <X size={17} />
                    </IconButton>
                </div>
            </div>

            {!chartDataQuery.data && (
                <Button disabled={chartDataQuery.isFetching} onClick={loadChartData}>
                    {chartDataQuery.isFetching ? 'Loading data' : 'Load chart data'}
                </Button>
            )}

            {chartDataQuery.data && (
                <ChartResult
                    data={chartDataQuery.data}
                    kind={chartDataQuery.data.kind}
                    ariaLabel={`${chart?.name ?? item.chartId} dashboard chart`}
                    barsLimit={6}
                    hideTable
                />
            )}
        </article>
    );
};
