import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useDatasetsPageActions, useDatasetsPageState } from '@/ui/pages/datasets/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useMemo } from 'react';

import { getSelected } from '@/shared/lib/getSelected';

import { datasetsTestIds } from './const';
import { DatasetWorkspace } from './ui/DatasetWorkspace';
import { UploadDatasetModal } from './ui/UploadDatasetModal';

import styles from './datasets.page.module.css';

export const DatasetsPage = () => {
    const { selectDataset, setShowUpload } = useDatasetsPageActions();

    const selectedDatasetId = useDatasetsPageState(state => state.selectedDatasetId);
    const showUpload = useDatasetsPageState(state => state.showUpload);

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );
    const datasetReloadVersion = useDatasetsPageState(state =>
        selectedDataset
            ? (state.datasetReloadVersions[selectedDataset.dataset.id] ?? 0)
            : 0
    );

    const handleUploadSuccess = async (datasetId: string) => {
        selectDataset(datasetId);
        await dependencies.cache.read(dependencies.listDatasets, { orgId: org!.id });
    };

    return (
        <>
            <main
                className={styles['main-panel']}
                data-stack="v"
                data-flex
                data-test-id={datasetsTestIds.workspace}
            >
                <DatasetWorkspace
                    key={`${selectedDataset?.dataset.id ?? 'none'}:${datasetReloadVersion}`}
                    selectedDataset={selectedDataset}
                />
            </main>

            {showUpload && (
                <UploadDatasetModal
                    org={org}
                    onUploadSuccess={handleUploadSuccess}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </>
    );
};
