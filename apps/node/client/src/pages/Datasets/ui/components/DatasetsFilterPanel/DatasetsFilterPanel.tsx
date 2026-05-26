import { skipToken } from '@reduxjs/toolkit/query';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';

import { formatDate } from '@/shared/lib/formatDate';
import {
    EmptyState,
    FilterChip,
    IconButton,
    SectionHeader,
    SegmentedTabs,
    SelectableList,
    StatusMessage,
} from '@/shared/ui';

import { datasetsTestIds } from '../../../const';
import {
    clearChartFilter,
    clearDashboardFilter,
    selectDatasetsFilterActiveTab,
    selectFilterChartIds,
    selectFilterDashboardIds,
    setDatasetsFilterActiveTab,
    toggleChartFilter,
    toggleDashboardFilter,
} from '../../../model';

import styles from './DatasetsFilterPanel.module.scss';

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
        activeTab === 'charts'
            ? filterChartIds.length > 0
            : filterDashboardIds.length > 0;

    const handleClear = () => {
        if (activeTab === 'charts') {
            dispatch(clearChartFilter());
        } else {
            dispatch(clearDashboardFilter());
        }
    };

    return (
        <div className={styles['filter-section']}>
            <SectionHeader
                eyebrow="Filter by"
                actions={
                    <IconButton
                        data-test-id={datasetsTestIds.clearFilterButton}
                        aria-label="Clear filter"
                        style={{ visibility: hasActiveFilter ? 'visible' : 'hidden' }}
                        onClick={handleClear}
                    >
                        <X size={16} />
                    </IconButton>
                }
            />

            <SegmentedTabs
                value={activeTab}
                options={[
                    {
                        value: 'charts',
                        label: 'Charts',
                        count: filterChartIds.length,
                        testId: datasetsTestIds.filterTabCharts,
                    },
                    {
                        value: 'dashboards',
                        label: 'Dashboards',
                        count: filterDashboardIds.length,
                        testId: datasetsTestIds.filterTabDashboards,
                    },
                ]}
                onChange={value => dispatch(setDatasetsFilterActiveTab(value))}
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
                                data-test-id={datasetsTestIds.filterChip}
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
                                data-test-id={datasetsTestIds.filterChip}
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
        </div>
    );
};
