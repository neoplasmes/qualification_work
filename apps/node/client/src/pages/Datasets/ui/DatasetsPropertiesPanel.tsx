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
import { MergeDatasetModal } from './MergeDatasetModal';

import {
    selectDataset,
    selectSelectedDatasetId,
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

export const DatasetsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [datasetError, setDatasetError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [showMerge, setShowMerge] = useState(false);

    const selectedDatasetId = useSelector(selectSelectedDatasetId);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [deleteDataset, deleteState] = useDeleteDatasetMutation();

    const selectedDataset = useMemo(
        () => getSelectedDataset(datasetsQuery.data, selectedDatasetId),
        [datasetsQuery.data, selectedDatasetId]
    );

    const handleDeleteDataset = async () => {
        if (!selectedDataset) { return; }

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

    if (!selectedDataset) {
        return <p className={styles['panel-placeholder']}>Select a dataset to view properties.</p>;
    }

    return (
        <>
            <DatasetDetails
                selectedDataset={selectedDataset}
                deleteConfirmationId={deleteConfirmationId}
                deleting={deleteState.isLoading}
                error={datasetError}
                onDelete={() => void handleDeleteDataset()}
                onMerge={() => setShowMerge(true)}
            />

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
