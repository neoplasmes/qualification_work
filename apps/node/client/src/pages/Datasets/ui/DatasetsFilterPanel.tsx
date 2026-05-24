import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListChartsQuery } from '@/features/charts';
import { useListDashboardsQuery } from '@/features/dashboards';

import { formatDate } from '@/shared/lib/formatDate';
import { IconButton } from '@/shared/ui';

import {
    toggleChartFilter,
    toggleDashboardFilter,
    clearChartFilter,
    clearDashboardFilter,
    selectFilterChartIds,
    selectFilterDashboardIds,
    selectDatasetsFilterActiveTab,
    setDatasetsFilterActiveTab,
} from '../model/datasetsPageSlice';

import styles from './DatasetsPage.module.scss';

export const DatasetsFilterPanel = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectDatasetsFilterActiveTab);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const filterChartIds = useSelector(selectFilterChartIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const hasActiveFilter =
        activeTab === 'charts' ? filterChartIds.length > 0 : filterDashboardIds.length > 0;

    const handleClear = () => {
        if (activeTab === 'charts') {
            dispatch(clearChartFilter());
        } else {
            dispatch(clearDashboardFilter());
        }
    };

    return (
        <div className={styles['filter-section']}>
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
                    onClick={() => dispatch(setDatasetsFilterActiveTab('charts'))}
                >
                    Charts
                    {filterChartIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterChartIds.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'dashboards' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setDatasetsFilterActiveTab('dashboards'))}
                >
                    Dashboards
                    {filterDashboardIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterDashboardIds.length}</span>
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

                {activeTab === 'dashboards' && (
                    <>
                        {!dashboardsQuery.data && (
                            <div className={styles['status']}>Loading...</div>
                        )}
                        {dashboardsQuery.data?.length === 0 && (
                            <div className={styles['empty']}>No dashboards yet.</div>
                        )}
                        {dashboardsQuery.data?.map(dashboard => (
                            <button
                                type="button"
                                key={dashboard.id}
                                className={`${styles['filter-chip']} ${
                                    filterDashboardIds.includes(dashboard.id)
                                        ? styles['selected']
                                        : ''
                                }`}
                                onClick={() => dispatch(toggleDashboardFilter(dashboard.id))}
                            >
                                <div className={styles['filter-chip-name']}>{dashboard.name}</div>
                                <div className={styles['filter-chip-meta']}>
                                    <span>{dashboard.items?.length ?? 0} widgets</span>
                                    <span>{formatDate(dashboard.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
