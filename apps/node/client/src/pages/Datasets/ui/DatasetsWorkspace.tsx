import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import {
    useDeleteDatasetMutation,
    useListDatasetsQuery,
    type DatasetMetadata,
} from '@/features/datasets';

import { getApiErrorMessage } from '@/shared/api';

import { DatasetDetails } from './DatasetDetails';
import { DatasetPreview } from './DatasetPreview';
import { MergeDatasetModal } from './MergeDatasetModal';
import { UploadDatasetModal } from './UploadDatasetModal';

import {
    selectSelectedDatasetId,
    selectShowUpload,
    selectDataset,
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
    const [datasetError, setDatasetError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [showMerge, setShowMerge] = useState(false);

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const showUpload = useSelector(selectShowUpload);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [deleteDataset, deleteState] = useDeleteDatasetMutation();

    const selectedDataset = useMemo(
        () => getSelectedDataset(datasetsQuery.data, selectedDatasetId),
        [datasetsQuery.data, selectedDatasetId]
    );

    const handleDeleteDataset = async () => {
        if (!selectedDataset) {
            return;
        }

        if (deleteConfirmationId !== selectedDataset.dataset.id) {
            setDeleteConfirmationId(selectedDataset.dataset.id);

            return;
        }

        setDatasetError('');

        try {
            await deleteDataset(selectedDataset.dataset.id).unwrap();
            dispatch(selectDataset(null));
            setDeleteConfirmationId(null);
            await datasetsQuery.refetch();
        } catch (error) {
            setDatasetError(getApiErrorMessage(error, 'Unable to delete this dataset.'));
        }
    };

    const handleUploadSuccess = async (datasetId: string) => {
        dispatch(selectDataset(datasetId));
        await datasetsQuery.refetch();
    };

    return (
        <>
            <main className={styles['main-panel']}>
                {selectedDataset && (
                    <DatasetDetails
                        selectedDataset={selectedDataset}
                        deleteConfirmationId={deleteConfirmationId}
                        deleting={deleteState.isLoading}
                        error={datasetError}
                        onDelete={() => void handleDeleteDataset()}
                        onMerge={() => setShowMerge(true)}
                    />
                )}

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

            {showMerge && (
                <MergeDatasetModal
                    org={org}
                    selectedDataset={selectedDataset}
                    onSuccess={async () => {
                        await datasetsQuery.refetch();
                    }}
                    onClose={() => setShowMerge(false)}
                />
            )}
        </>
    );
};
