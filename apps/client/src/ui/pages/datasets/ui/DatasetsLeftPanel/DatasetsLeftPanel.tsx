import { filterDatasets } from '@/core/processes/entityFiltering';
import { useDatasetsPageActions, useDatasetsPageState } from '@/ui/pages/datasets/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { skipToken } from '@reduxjs/toolkit/query';
import { Sheet, Upload } from 'lucide-react';
import { useMemo } from 'react';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { datasetsTestIds } from '../../const';

export const DatasetsLeftPanel = () => {
    const { selectDataset, setShowUpload } = useDatasetsPageActions();

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedDatasetId = useDatasetsPageState(state => state.selectedDatasetId);
    const filterValues = useFilters(state => state.values['datasets']);

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
                onClick: () => setShowUpload(true),
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
                    onClick={() => selectDataset(item.dataset.id)}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
