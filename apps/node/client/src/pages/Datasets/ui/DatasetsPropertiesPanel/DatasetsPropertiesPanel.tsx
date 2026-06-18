import { skipToken } from '@reduxjs/toolkit/query';
import { GitMerge, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import {
    useDeleteDatasetMutation,
    useListDatasetsQuery,
    usePatchDatasetMutation,
} from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { useAppSelector } from '@/shared/model';
import {
    Button,
    EditableText,
    PanelPlaceholder,
    StatusMessage,
    Table,
} from '@/shared/ui';

import { datasetsTestIds } from '../../const';
import { bumpDatasetReloadVersion, selectDataset } from '../../model';
import { MergeDatasetModal } from '../MergeDatasetModal';

import styles from './DatasetsPropertiesPanel.module.scss';

export const DatasetsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [datasetError, setDatasetError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [showMerge, setShowMerge] = useState(false);

    const selectedDatasetId = useAppSelector(
        state => state.datasetsPage.selectedDatasetId
    );

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [patchDataset, patchState] = usePatchDatasetMutation();
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

    const handleRenameDataset = async (name: string) => {
        // editor only renders when a dataset is selected; bail loudly if invariant breaks
        if (!selectedDataset) {
            throw new Error('No dataset selected for rename.');
        }

        setDatasetError('');

        try {
            await patchDataset({
                datasetId: selectedDataset.dataset.id,
                name,
            }).unwrap();
            await datasetsQuery.refetch();
        } catch (error) {
            const message = getApiErrorMessage(error, 'Unable to rename this dataset.');
            setDatasetError(message);

            throw new Error(message);
        }
    };

    if (!selectedDataset) {
        return <PanelPlaceholder>Select a dataset to view properties.</PanelPlaceholder>;
    }

    return (
        <>
            <section className={styles['details']} data-flex aria-label="Dataset details">
                <div className={styles['details-header']}>
                    <EditableText
                        title={selectedDataset.dataset.name}
                        fallbackTitle="Untitled dataset"
                        saving={patchState.isLoading}
                        editButtonTestId={datasetsTestIds.renameButton}
                        inputTestId={datasetsTestIds.renameInput}
                        onRename={handleRenameDataset}
                    />
                    <div className={styles['details-actions']}>
                        <Button onClick={() => setShowMerge(true)}>
                            <GitMerge size={18} />
                            Merge data
                        </Button>
                    </div>
                </div>

                {datasetError && (
                    <StatusMessage tone="error">{datasetError}</StatusMessage>
                )}

                <Table
                    aria-label="Dataset properties"
                    headers={{ key: 'Property', value: 'Value' }}
                    rows={[
                        { key: 'Rows', value: selectedDataset.totalRows },
                        { key: 'Columns', value: selectedDataset.columns.length },
                        { key: 'Source', value: selectedDataset.dataset.sourceType },
                        {
                            key: 'Created',
                            value: formatDate(selectedDataset.dataset.createdAt),
                        },
                    ]}
                />

                <Table
                    aria-label="Dataset columns"
                    headers={{ key: 'Column', value: 'Type' }}
                    rows={selectedDataset.columns.map(column => ({
                        id: column.id,
                        key: column.displayName,
                        value: column.dataType,
                    }))}
                />

                <div className={styles['delete-actions']}>
                    <Button
                        tone="danger"
                        disabled={deleteState.isLoading}
                        onClick={() => void handleDeleteDataset()}
                    >
                        <Trash2 size={18} />
                        {deleteConfirmationId === selectedDataset.dataset.id
                            ? 'Confirm delete'
                            : 'Delete'}
                    </Button>
                </div>
            </section>

            {showMerge && (
                <MergeDatasetModal
                    org={org}
                    selectedDataset={selectedDataset}
                    onSuccess={async datasetId => {
                        dispatch(selectDataset(datasetId));
                        await datasetsQuery.refetch();
                        // server doesnt bump dataset.updatedAt on merge, so signal the
                        // preview explicitly to remount and refetch rows + columns
                        dispatch(bumpDatasetReloadVersion(datasetId));
                    }}
                    onClose={() => setShowMerge(false)}
                />
            )}
        </>
    );
};
