import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import {
    dashboardChartAxisLabelsHiddenMaxSize,
    dashboardChartDescriptionHiddenMaxHeight,
    dashboardsTestIds,
} from '../../../../../const';
import { DashboardChartCard } from '../../../DashboardChartCard';

import styles from './ChartWidget.module.scss';

type ChartWidgetProps = {
    item: Extract<DashboardItem, { kind: 'chart' }>;
    chart: Chart | undefined;
    columns: DatasetColumn[];
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
};

export const ChartWidget = ({
    item,
    chart,
    columns,
    removing,
    onRemoveItem,
}: ChartWidgetProps) => (
    <div className={styles['chart-widget']}>
        <DashboardChartCard
            item={item}
            chart={chart}
            columns={columns}
            removing={removing}
            onRemove={onRemoveItem}
            showDescription={
                item.layout.height > dashboardChartDescriptionHiddenMaxHeight
            }
            showAxisTickLabels={
                item.layout.width > dashboardChartAxisLabelsHiddenMaxSize &&
                item.layout.height > dashboardChartAxisLabelsHiddenMaxSize
            }
            data-test-id={dashboardsTestIds.chartWidget}
        />
    </div>
);
