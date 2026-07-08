import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListDatasetsQuery } from '@/entities/dataset';

import { getSelected } from '@/shared/lib/getSelected';
import { useAppSelector } from '@/shared/model';

import { datasetsTestIds } from './const';
import { selectDataset, setShowUpload } from './model';
import { DatasetWorkspace } from './ui/DatasetWorkspace';
import { UploadDatasetModal } from './ui/UploadDatasetModal';

import styles from './DatasetsPage.module.scss';

export const DatasetsPage = () => {
    const dispatch = useDispatch();

    const selectedDatasetId = useAppSelector(
        state => state.datasetsPage.selectedDatasetId
    );
    const showUpload = useAppSelector(state => state.datasetsPage.showUpload);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );
    const datasetReloadVersion = useAppSelector(state =>
        selectedDataset
            ? (state.datasetsPage.datasetReloadVersions[selectedDataset.dataset.id] ?? 0)
            : 0
    );

    const handleUploadSuccess = async (datasetId: string) => {
        dispatch(selectDataset(datasetId));
        await datasetsQuery.refetch();
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
                    onClose={() => dispatch(setShowUpload(false))}
                />
            )}
        </>
    );
};
