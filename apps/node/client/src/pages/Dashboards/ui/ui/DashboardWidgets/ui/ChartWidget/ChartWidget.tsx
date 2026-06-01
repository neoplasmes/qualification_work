import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';
import type { DatasetColumn } from '@/entities/dataset';

import {
    dashboardChartAxisLabelsMinHeight,
    dashboardChartAxisLabelsMinWidth,
    dashboardChartDescriptionMinHeight,
    dashboardChartDescriptionMinWidth,
    dashboardsTestIds,
} from '../../../../../const';
import { DashboardChartCard } from '../../../DashboardChartCard';

import { useMeasuredElementSize } from '../../lib';

import styles from './ChartWidget.module.scss';

type ChartWidgetProps = {
    item: Extract<DashboardItem, { kind: 'chart' }>;
    chart: Chart | undefined;
    columns: DatasetColumn[];
    sourceName?: string;
    removing: boolean;
    onRemoveItem: (itemId: string) => void;
};

export const ChartWidget = ({
    item,
    chart,
    columns,
    sourceName,
    removing,
    onRemoveItem,
}: ChartWidgetProps) => {
    const { ref, size } = useMeasuredElementSize<HTMLDivElement>();
    const hasMeasuredSize = size.width > 0 && size.height > 0;
    const showDescription =
        hasMeasuredSize &&
        size.width >= dashboardChartDescriptionMinWidth &&
        size.height >= dashboardChartDescriptionMinHeight;
    const showAxisTickLabels =
        hasMeasuredSize &&
        size.width >= dashboardChartAxisLabelsMinWidth &&
        size.height >= dashboardChartAxisLabelsMinHeight;

    return (
        <div ref={ref} className={styles['chart-widget']}>
            <DashboardChartCard
                item={item}
                chart={chart}
                columns={columns}
                removing={removing}
                sourceName={sourceName}
                onRemove={onRemoveItem}
                showDescription={showDescription}
                showAxisTickLabels={showAxisTickLabels}
                data-test-id={dashboardsTestIds.chartWidget}
            />
        </div>
    );
};
