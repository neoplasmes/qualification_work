import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListDatasetsQuery, type DatasetMetadata } from '@/features/datasets';

import { DatasetPreview } from './DatasetPreview';
import { UploadDatasetModal } from './UploadDatasetModal';

import {
    selectDataset,
    selectSelectedDatasetId,
    selectShowUpload,
    setShowUpload,
} from '../model/datasetsPageSlice';

import styles from './DatasetsPage.module.scss';

const getSelectedDataset = (
    datasets: DatasetMetadata[] | undefined,
    selectedDatasetId: string | null
) => {
    if (!datasets || datasets.length === 0) {
        return undefined;
    }

    return datasets.find(item => item.dataset.id === selectedDatasetId) ?? datasets[0];
};

export const DatasetsWorkspace = () => {
    const dispatch = useDispatch();

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const showUpload = useSelector(selectShowUpload);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedDataset = useMemo(
        () => getSelectedDataset(datasetsQuery.data, selectedDatasetId),
        [datasetsQuery.data, selectedDatasetId]
    );

    const handleUploadSuccess = async (datasetId: string) => {
        dispatch(selectDataset(datasetId));
        await datasetsQuery.refetch();
    };

    return (
        <>
            <main className={styles['main-panel']}>
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
