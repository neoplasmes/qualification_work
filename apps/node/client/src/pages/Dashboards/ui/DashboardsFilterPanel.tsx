import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListChartsQuery } from '@/features/charts';
import { useListDatasetsQuery } from '@/features/datasets';

import { formatDate } from '@/shared/lib/formatDate';
import { IconButton } from '@/shared/ui';

import {
    toggleChartFilter,
    toggleDatasetFilter,
    clearChartFilter,
    clearDatasetFilter,
    selectFilterChartIds,
    selectFilterDatasetIds,
    selectDashboardsFilterActiveTab,
    setDashboardsFilterActiveTab,
} from '../model/dashboardsPageSlice';

import styles from './DashboardsPage.module.scss';

export const DashboardsFilterPanel = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectDashboardsFilterActiveTab);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const filterChartIds = useSelector(selectFilterChartIds);
    const filterDatasetIds = useSelector(selectFilterDatasetIds);

    const hasActiveFilter =
        activeTab === 'charts' ? filterChartIds.length > 0 : filterDatasetIds.length > 0;

    const handleClear = () => {
        if (activeTab === 'charts') {
            dispatch(clearChartFilter());
        } else {
            dispatch(clearDatasetFilter());
        }
    };

    return (
        <aside className={styles['panel']}>
            <div data-stack="h" data-align="center" data-justify="between">
                <span className={styles['eyebrow']}>Filter by</span>
                <IconButton
                    aria-label="Clear filter"
                    style={{ visibility: hasActiveFilter ? 'visible' : 'hidden' }}
                    onClick={handleClear}
                >
                    <X size={16} />
                </IconButton>
            </div>

            <div className={styles['filter-tabs']}>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'charts' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setDashboardsFilterActiveTab('charts'))}
                >
                    Charts
                    {filterChartIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterChartIds.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'datasets' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setDashboardsFilterActiveTab('datasets'))}
                >
                    Datasets
                    {filterDatasetIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterDatasetIds.length}</span>
                    )}
                </button>
            </div>

            <div className={styles['filter-chip-list']}>
                {activeTab === 'charts' && (
                    <>
                        {!chartsQuery.data && <div className={styles['status']}>Loading...</div>}
                        {chartsQuery.data?.length === 0 && (
                            <div className={styles['empty']}>No charts yet.</div>
                        )}
                        {chartsQuery.data?.map(chart => (
                            <button
                                type="button"
                                key={chart.id}
                                className={`${styles['filter-chip']} ${
                                    filterChartIds.includes(chart.id) ? styles['selected'] : ''
                                }`}
                                onClick={() => dispatch(toggleChartFilter(chart.id))}
                            >
                                <div className={styles['filter-chip-name']}>{chart.name}</div>
                                <div className={styles['filter-chip-meta']}>
                                    <span>{chart.chartType}</span>
                                    <span>{formatDate(chart.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}

                {activeTab === 'datasets' && (
                    <>
                        {!datasetsQuery.data && <div className={styles['status']}>Loading...</div>}
                        {datasetsQuery.data?.length === 0 && (
                            <div className={styles['empty']}>No datasets yet.</div>
                        )}
                        {datasetsQuery.data?.map(item => (
                            <button
                                type="button"
                                key={item.dataset.id}
                                className={`${styles['filter-chip']} ${
                                    filterDatasetIds.includes(item.dataset.id)
                                        ? styles['selected']
                                        : ''
                                }`}
                                onClick={() => dispatch(toggleDatasetFilter(item.dataset.id))}
                            >
                                <div className={styles['filter-chip-name']}>
                                    {item.dataset.name}
                                </div>
                                <div className={styles['filter-chip-meta']}>
                                    <span>{item.totalRows} rows</span>
                                    <span>{formatDate(item.dataset.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </aside>
    );
};
