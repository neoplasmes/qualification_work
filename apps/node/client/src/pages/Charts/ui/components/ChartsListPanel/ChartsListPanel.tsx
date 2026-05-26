import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery, type Chart } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { formatDate } from '@/shared/lib/formatDate';
import { Badge, Button, EmptyState, StatusMessage } from '@/shared/ui';

import { chartsTestIds } from '../../../const';
import { filterCharts } from '../../../lib';
import {
    selectChart,
    selectFilterDashboardIds,
    selectFilterDatasetIds,
    selectSelectedChartId,
    setShowDatasetPicker,
} from '../../../model';

import styles from './ChartsListPanel.module.scss';

export const ChartsListPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedChartId = useSelector(selectSelectedChartId);
    const filterDatasetIds = useSelector(selectFilterDatasetIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const filteredCharts = filterCharts({
        charts: chartsQuery.data,
        dashboards: dashboardsQuery.data,
        datasetIds: filterDatasetIds,
        dashboardIds: filterDashboardIds,
    });

    const handleSelect = (chartId: string) => {
        dispatch(selectChart(chartId));
    };

    return (
        <aside className={styles['panel']} data-test-id={chartsTestIds.listPanel}>
            <div data-stack="h" data-align="center" data-justify="between">
                <h1 className={styles['title']}>Charts</h1>
                <span className={styles['muted']}>
                    {filteredCharts ? `${filteredCharts.length} charts` : 'Loading'}
                </span>
            </div>

            <Button
                className={styles['full-button']}
                data-test-id={chartsTestIds.createChartButton}
                onClick={() => dispatch(setShowDatasetPicker(true))}
            >
                <Plus size={18} />
                Create chart
            </Button>

            <section className={styles['chart-list']} aria-label="Saved charts">
                {chartsQuery.isLoading && (
                    <StatusMessage centered>Loading charts...</StatusMessage>
                )}
                {filteredCharts?.length === 0 && (
                    <EmptyState>Build a chart from a dataset to see it here.</EmptyState>
                )}
                {filteredCharts?.map((chart: Chart) => (
                    <button
                        type="button"
                        key={chart.id}
                        data-test-id={chartsTestIds.chartListItem}
                        className={`${styles['chart-item']} ${
                            selectedChartId === chart.id ? styles['selected'] : ''
                        }`}
                        onClick={() => handleSelect(chart.id)}
                    >
                        <div>
                            <div className={styles['chart-name']}>{chart.name}</div>
                            <div className={styles['chart-meta']}>
                                <span>{formatDate(chart.createdAt)}</span>
                                <span>{chart.datasetId.slice(0, 8)}</span>
                            </div>
                        </div>
                        <Badge>{chart.chartType}</Badge>
                    </button>
                ))}
            </section>
        </aside>
    );
};
