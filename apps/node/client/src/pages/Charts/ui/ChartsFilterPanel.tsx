import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListDatasetsQuery } from '@/features/datasets';
import { useListDashboardsQuery } from '@/features/dashboards';

import { formatDate } from '@/shared/lib/formatDate';
import { IconButton } from '@/shared/ui';

import {
    toggleDatasetFilter,
    toggleDashboardFilter,
    clearDatasetFilter,
    clearDashboardFilter,
    selectFilterDatasetIds,
    selectFilterDashboardIds,
    selectChartsFilterActiveTab,
    setChartsFilterActiveTab,
} from '../model/chartsPageSlice';

import styles from './ChartsPage.module.scss';

export const ChartsFilterPanel = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectChartsFilterActiveTab);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const filterDatasetIds = useSelector(selectFilterDatasetIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const hasActiveFilter =
        activeTab === 'datasets' ? filterDatasetIds.length > 0 : filterDashboardIds.length > 0;

    const handleClear = () => {
        if (activeTab === 'datasets') {
            dispatch(clearDatasetFilter());
        } else {
            dispatch(clearDashboardFilter());
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
                    className={`${styles['filter-tab']} ${activeTab === 'datasets' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setChartsFilterActiveTab('datasets'))}
                >
                    Datasets
                    {filterDatasetIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterDatasetIds.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'dashboards' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setChartsFilterActiveTab('dashboards'))}
                >
                    Dashboards
                    {filterDashboardIds.length > 0 && (
                        <span className={styles['filter-tab-count']}>{filterDashboardIds.length}</span>
                    )}
                </button>
            </div>

            <div className={styles['dataset-filter-list']}>
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
                                className={`${styles['dataset-chip']} ${
                                    filterDatasetIds.includes(item.dataset.id) ? styles['selected'] : ''
                                }`}
                                onClick={() => dispatch(toggleDatasetFilter(item.dataset.id))}
                            >
                                <div className={styles['dataset-chip-name']}>{item.dataset.name}</div>
                                <div className={styles['dataset-chip-meta']}>
                                    <span>{item.totalRows} rows</span>
                                    <span>{formatDate(item.dataset.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}

                {activeTab === 'dashboards' && (
                    <>
                        {!dashboardsQuery.data && <div className={styles['status']}>Loading...</div>}
                        {dashboardsQuery.data?.length === 0 && (
                            <div className={styles['empty']}>No dashboards yet.</div>
                        )}
                        {dashboardsQuery.data?.map(dashboard => (
                            <button
                                type="button"
                                key={dashboard.id}
                                className={`${styles['dataset-chip']} ${
                                    filterDashboardIds.includes(dashboard.id) ? styles['selected'] : ''
                                }`}
                                onClick={() => dispatch(toggleDashboardFilter(dashboard.id))}
                            >
                                <div className={styles['dataset-chip-name']}>{dashboard.name}</div>
                                <div className={styles['dataset-chip-meta']}>
                                    <span>{dashboard.items?.length ?? 0} widgets</span>
                                    <span>{formatDate(dashboard.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </aside>
    );
};
