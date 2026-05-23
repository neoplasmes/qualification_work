import { Plus, RefreshCcw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListChartsQuery, type Chart } from '@/features/charts';
import { useListDatasetsQuery } from '@/features/datasets';
import { useListDashboardsQuery } from '@/features/dashboards';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

import {
    selectChart,
    selectSelectedChartId,
    selectFilterDatasetIds,
    selectFilterDashboardIds,
    setShowDatasetPicker,
} from '../model/chartsPageSlice';

import styles from './ChartsPage.module.scss';

export const ChartsListPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);

    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedChartId = useSelector(selectSelectedChartId);
    const filterDatasetIds = useSelector(selectFilterDatasetIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const charts = chartsQuery.data;

    const filteredCharts = (() => {
        if (!charts) return charts;

        let result = charts;

        if (filterDatasetIds.length > 0) {
            result = result.filter(c => filterDatasetIds.includes(c.datasetId));
        }

        if (filterDashboardIds.length > 0) {
            const chartIdsInDashboards = new Set(
                (dashboardsQuery.data ?? [])
                    .filter(d => filterDashboardIds.includes(d.id))
                    .flatMap(d => (d.items ?? []).filter(item => item.kind === 'chart').map(item => item.chartId))
            );
            result = result.filter(c => chartIdsInDashboards.has(c.id));
        }

        return result;
    })();

    const handleSelect = (chartId: string) => {
        dispatch(selectChart(chartId));
    };

    return (
        <aside className={styles['panel']}>
            <div data-stack="h" data-align="center" data-justify="between">
                <div data-stack="v" data-gap="xs">
                    <h1 className={styles['title']}>Charts</h1>
                    <p className={styles['muted']}>
                        {filteredCharts ? `${filteredCharts.length} charts` : 'Loading'}
                    </p>
                </div>
                <IconButton
                    aria-label="Refresh charts"
                    disabled={chartsQuery.isFetching}
                    onClick={() => void chartsQuery.refetch()}
                >
                    <RefreshCcw size={18} />
                </IconButton>
            </div>

            <Button
                className={styles['full-button']}
                onClick={() => dispatch(setShowDatasetPicker(true))}
            >
                <Plus size={18} />
                Create chart
            </Button>

            <section className={styles['chart-list']} aria-label="Saved charts">
                {chartsQuery.isLoading && (
                    <div className={styles['status']}>Loading charts...</div>
                )}
                {filteredCharts?.length === 0 && (
                    <div className={styles['empty']}>
                        Build a chart from a dataset to see it here.
                    </div>
                )}
                {filteredCharts?.map((chart: Chart) => (
                    <button
                        type="button"
                        key={chart.id}
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
                        <span className={styles['badge']}>{chart.chartType}</span>
                    </button>
                ))}
            </section>
        </aside>
    );
};
