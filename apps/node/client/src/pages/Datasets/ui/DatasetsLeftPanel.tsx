import { skipToken } from '@reduxjs/toolkit/query';
import { Upload } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Badge } from '@/shared/ui';

import { datasetsTestIds } from '../const';
import { filterDatasets } from '../lib';
import {
    selectDataset,
    selectFilterChartIds,
    selectFilterDashboardIds,
    selectSelectedDatasetId,
    setShowUpload,
} from '../model';

export const DatasetsLeftPanel = () => {
    const dispatch = useDispatch();

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const filterChartIds = useSelector(selectFilterChartIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );

    const filteredDatasets = useMemo(
        () =>
            filterDatasets({
                datasets: datasetsQuery.data,
                charts: chartsQuery.data,
                dashboards: dashboardsQuery.data,
                chartIds: filterChartIds,
                dashboardIds: filterDashboardIds,
            }),
        [
            chartsQuery.data,
            dashboardsQuery.data,
            datasetsQuery.data,
            filterChartIds,
            filterDashboardIds,
        ]
    );

    return (
        <WorkspaceLeftPanel
            title="Datasets"
            countLabel={`${filteredDatasets?.length ?? 0} datasets`}
            testId={datasetsTestIds.uploadPanel}
            listLabel="Datasets"
            loading={datasetsQuery.isLoading}
            loadingText="Loading datasets..."
            empty={filteredDatasets?.length === 0}
            emptyText="Upload a dataset to start."
            action={{
                label: 'Upload dataset',
                icon: <Upload size={18} />,
                testId: datasetsTestIds.uploadButton,
                onClick: () => dispatch(setShowUpload(true)),
            }}
        >
            {filteredDatasets?.map(item => (
                <WorkspaceLeftPanelItem
                    key={item.dataset.id}
                    selected={selectedDataset?.dataset.id === item.dataset.id}
                    testId={datasetsTestIds.datasetListItem}
                    title={item.dataset.name}
                    meta={[formatDate(item.dataset.createdAt)]}
                    badge={<Badge>{item.dataset.sourceType}</Badge>}
                    multilineTitle
                    onClick={() => dispatch(selectDataset(item.dataset.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
