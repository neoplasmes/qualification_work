import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useDeleteDatasetMutation, useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { getSelected } from '@/shared/lib/getSelected';
import { PanelPlaceholder } from '@/shared/ui';

import { selectDataset, selectSelectedDatasetId } from '../../../model';

import { DatasetDetails } from '../DatasetDetails';
import { MergeDatasetModal } from '../MergeDatasetModal';

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
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
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

    if (!selectedDataset) {
        return <PanelPlaceholder>Select a dataset to view properties.</PanelPlaceholder>;
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
