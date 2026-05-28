import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import { dashboardsTestIds } from '../../../../../const';
import { DashboardChartCard } from '../../../DashboardChartCard';

import styles from './ChartWidget.module.scss';

type ChartWidgetProps = {
    item: Extract<DashboardItem, { kind: 'chart' }>;
    chart: Chart | undefined;
    columns: DatasetColumn[];
    index: number;
    itemsCount: number;
    reorderLoading: boolean;
    removing: boolean;
    onMoveItem: (itemId: string, direction: -1 | 1) => void;
    onRemoveItem: (itemId: string) => void;
};

export const ChartWidget = ({
    item,
    chart,
    columns,
    index,
    itemsCount,
    reorderLoading,
    removing,
    onMoveItem,
    onRemoveItem,
}: ChartWidgetProps) => (
    <div className={styles['chart-widget']}>
        <DashboardChartCard
            item={item}
            chart={chart}
            columns={columns}
            index={index}
            itemsCount={itemsCount}
            reorderLoading={reorderLoading}
            removing={removing}
            onMoveItem={onMoveItem}
            onRemove={onRemoveItem}
            data-test-id={dashboardsTestIds.chartWidget}
        />
    </div>
);
