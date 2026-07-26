import { filterDatasets } from '@/core/processes/entityFiltering';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useDatasetsPageActions, useDatasetsPageState } from '@/ui/pages/datasets/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { Text, VStack } from '@qualification-work/design-system';
import { Upload } from 'lucide-react';
import { useMemo } from 'react';

import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';

import { datasetsTestIds } from '../../const';

import styles from './datasetsLeftPanel.module.css';

export const DatasetsLeftPanel = () => {
    const { selectDataset, setShowUpload } = useDatasetsPageActions();

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const chartsQuery = useRead(
        useDependencies().listCharts,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const dashboardsQuery = useRead(
        useDependencies().listDashboards,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );

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
            title="Таблицы"
            countLabel={`Всего: ${filteredDatasets?.length ?? 0}`}
            testId={datasetsTestIds.uploadPanel}
            listLabel="Таблицы"
            loading={Boolean(org?.id) && datasetsQuery.isPending}
            loadingText="Загружаем таблицы…"
            empty={filteredDatasets?.length === 0}
            emptyText="Загрузите первую таблицу."
            action={{
                label: 'Загрузить таблицу',
                Icon: Upload,
                testId: datasetsTestIds.uploadButton,
                onClick: () => setShowUpload(true),
            }}
        >
            {filteredDatasets?.map(item => (
                <button
                    key={item.dataset.id}
                    type="button"
                    className={styles.item}
                    aria-current={
                        selectedDataset?.dataset.id === item.dataset.id
                            ? 'true'
                            : undefined
                    }
                    data-test-id={datasetsTestIds.datasetListItem}
                    onClick={() => selectDataset(item.dataset.id)}
                >
                    <VStack gap={8} align="start">
                        <Text variant="body-sm">{item.dataset.name}</Text>
                        <Text variant="label">
                            {item.totalRows} строк · {item.columns.length} полей
                        </Text>
                        <Text variant="caption">
                            {formatDate(item.dataset.createdAt)}
                        </Text>
                    </VStack>
                </button>
            ))}
        </WorkspaceLeftPanel>
    );
};
