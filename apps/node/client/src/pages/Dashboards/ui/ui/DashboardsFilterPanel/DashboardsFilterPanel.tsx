import { skipToken } from '@reduxjs/toolkit/query';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery } from '@/entities/chart';
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

import { dashboardsTestIds } from '../../../const';
import {
    clearChartFilter,
    clearDatasetFilter,
    selectDashboardsFilterActiveTab,
    selectFilterChartIds,
    selectFilterDatasetIds,
    setDashboardsFilterActiveTab,
    toggleChartFilter,
    toggleDatasetFilter,
} from '../../../model';

import styles from './DashboardsFilterPanel.module.scss';

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
        <aside
            className={styles['panel']}
            data-stack="v"
            data-gap="md"
            data-flex
            data-test-id={dashboardsTestIds.filterPanel}
        >
            <div data-stack="h" data-align="center" data-justify="end">
                <IconButton
                    data-test-id={dashboardsTestIds.clearFilterButton}
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
                        value: 'charts',
                        label: 'Charts',
                        count: filterChartIds.length,
                        testId: dashboardsTestIds.filterTabCharts,
                    },
                    {
                        value: 'datasets',
                        label: 'Datasets',
                        count: filterDatasetIds.length,
                        testId: dashboardsTestIds.filterTabDatasets,
                    },
                ]}
                onChange={value => dispatch(setDashboardsFilterActiveTab(value))}
            />

            <SelectableList>
                {activeTab === 'charts' && (
                    <>
                        {!chartsQuery.data && (
                            <StatusMessage centered>Loading...</StatusMessage>
                        )}
                        {chartsQuery.data?.length === 0 && (
                            <EmptyState>No charts yet.</EmptyState>
                        )}
                        {chartsQuery.data?.map(chart => (
                            <FilterChip
                                key={chart.id}
                                data-test-id={dashboardsTestIds.filterChip}
                                selected={filterChartIds.includes(chart.id)}
                                label={chart.name}
                                meta={
                                    <>
                                        <span>{chart.chartType}</span>
                                        <span>{formatDate(chart.createdAt)}</span>
                                    </>
                                }
                                onClick={() => dispatch(toggleChartFilter(chart.id))}
                            />
                        ))}
                    </>
                )}

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
                                data-test-id={dashboardsTestIds.filterChip}
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
            </SelectableList>
        </aside>
    );
};
