import { skipToken } from '@reduxjs/toolkit/query';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import {
    EmptyState,
    FilterChip,
    IconButton,
    SegmentedTabs,
    SelectableList,
    StatusMessage,
} from '@/shared/ui';

import { chartsTestIds } from '../../../const';
import {
    clearDashboardFilter,
    clearDatasetFilter,
    selectChartsFilterActiveTab,
    selectFilterDashboardIds,
    selectFilterDatasetIds,
    setChartsFilterActiveTab,
    toggleDashboardFilter,
    toggleDatasetFilter,
} from '../../../model';

import styles from './ChartsFilterPanel.module.scss';

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
        activeTab === 'datasets'
            ? filterDatasetIds.length > 0
            : filterDashboardIds.length > 0;

    const handleClear = () => {
        if (activeTab === 'datasets') {
            dispatch(clearDatasetFilter());
        } else {
            dispatch(clearDashboardFilter());
        }
    };

    return (
        <aside className={styles['panel']} data-test-id={chartsTestIds.filterPanel}>
            <div data-stack="h" data-align="center" data-justify="between">
                <span className={styles['eyebrow']}>Filter by</span>
                <IconButton
                    data-test-id={chartsTestIds.clearFilterButton}
                    aria-label="Clear filter"
                    style={{ visibility: hasActiveFilter ? 'visible' : 'hidden' }}
                    onClick={handleClear}
                >
                    <X size={16} />
                </IconButton>
            </div>

            <SegmentedTabs
                value={activeTab}
                options={[
                    {
                        value: 'datasets',
                        label: 'Datasets',
                        count: filterDatasetIds.length,
                        testId: chartsTestIds.filterTabDatasets,
                    },
                    {
                        value: 'dashboards',
                        label: 'Dashboards',
                        count: filterDashboardIds.length,
                        testId: chartsTestIds.filterTabDashboards,
                    },
                ]}
                onChange={value => dispatch(setChartsFilterActiveTab(value))}
            />

            <SelectableList>
                {activeTab === 'datasets' && (
                    <>
                        {!datasetsQuery.data && (
                            <StatusMessage centered>Loading...</StatusMessage>
                        )}
                        {datasetsQuery.data?.length === 0 && (
                            <EmptyState>No datasets yet.</EmptyState>
                        )}
                        {datasetsQuery.data?.map(item => (
                            <FilterChip
                                key={item.dataset.id}
                                data-test-id={chartsTestIds.filterChip}
                                selected={filterDatasetIds.includes(item.dataset.id)}
                                label={item.dataset.name}
                                meta={
                                    <>
                                        <span>{item.totalRows} rows</span>
                                        <span>{formatDate(item.dataset.createdAt)}</span>
                                    </>
                                }
                                onClick={() =>
                                    dispatch(toggleDatasetFilter(item.dataset.id))
                                }
                            />
                        ))}
                    </>
                )}

                {activeTab === 'dashboards' && (
                    <>
                        {!dashboardsQuery.data && (
                            <StatusMessage centered>Loading...</StatusMessage>
                        )}
                        {dashboardsQuery.data?.length === 0 && (
                            <EmptyState>No dashboards yet.</EmptyState>
                        )}
                        {dashboardsQuery.data?.map(dashboard => (
                            <FilterChip
                                key={dashboard.id}
                                data-test-id={chartsTestIds.filterChip}
                                selected={filterDashboardIds.includes(dashboard.id)}
                                label={dashboard.name}
                                meta={
                                    <>
                                        <span>
                                            {dashboard.items?.length ?? 0} widgets
                                        </span>
                                        <span>{formatDate(dashboard.createdAt)}</span>
                                    </>
                                }
                                onClick={() =>
                                    dispatch(toggleDashboardFilter(dashboard.id))
                                }
                            />
                        ))}
                    </>
                )}
            </SelectableList>
        </aside>
    );
};
