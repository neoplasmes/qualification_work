import { skipToken } from '@reduxjs/toolkit/query';
import { Sheet, Upload } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    filterApplicationEntities,
    selectFilterApplicationValues,
} from '@/features/filterApplicationEntities';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';

import { datasetsTestIds } from '../const';
import { selectDataset, selectSelectedDatasetId, setShowUpload } from '../model';

export const DatasetsLeftPanel = () => {
    const dispatch = useDispatch();

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const filterValues = useSelector(selectFilterApplicationValues('datasets'));

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );

    const filteredDatasets = useMemo(
        () =>
            filterApplicationEntities({
                scope: 'datasets',
                datasets: datasetsQuery.data,
                charts: chartsQuery.data,
                dashboards: dashboardsQuery.data,
                values: filterValues,
            }),
        [chartsQuery.data, dashboardsQuery.data, datasetsQuery.data, filterValues]
    );

    return (
        <WorkspaceLeftPanel
            title="Datasets"
            countLabel={`Total: ${filteredDatasets?.length ?? 0} datasets`}
            testId={datasetsTestIds.uploadPanel}
            listLabel="Datasets"
            loading={datasetsQuery.isLoading}
            loadingText="Loading datasets..."
            empty={filteredDatasets?.length === 0}
            emptyText="Upload a dataset to start."
            action={{
                label: 'Upload dataset',
                Icon: Upload,
                testId: datasetsTestIds.uploadButton,
                onClick: () => dispatch(setShowUpload(true)),
            }}
        >
            {filteredDatasets?.map(item => (
                <WorkspaceLeftPanelItem
                    key={item.dataset.id}
                    selected={selectedDataset?.dataset.id === item.dataset.id}
                    testId={datasetsTestIds.datasetListItem}
                    header={item.dataset.name}
                    details={[formatDate(item.dataset.createdAt)]}
                    iconElement={<Sheet size={18} />}
                    onClick={() => dispatch(selectDataset(item.dataset.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
