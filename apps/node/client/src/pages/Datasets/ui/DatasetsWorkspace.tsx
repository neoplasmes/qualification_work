import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListDatasetsQuery } from '@/entities/dataset';

import { getSelected } from '@/shared/lib/getSelected';

import { datasetsTestIds } from '../const';
import {
    selectDataset,
    selectSelectedDatasetId,
    selectShowUpload,
    setShowUpload,
} from '../model';
import { DatasetPreview } from './components/DatasetPreview';
import { UploadDatasetModal } from './components/UploadDatasetModal';

import styles from './DatasetsWorkspace.module.scss';

export const DatasetsWorkspace = () => {
    const dispatch = useDispatch();

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const showUpload = useSelector(selectShowUpload);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );

    const handleUploadSuccess = async (datasetId: string) => {
        dispatch(selectDataset(datasetId));
        await datasetsQuery.refetch();
    };

    return (
        <>
            <main
                className={styles['main-panel']}
                data-test-id={datasetsTestIds.workspace}
            >
                <DatasetPreview
                    key={selectedDataset?.dataset.id ?? 'none'}
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
