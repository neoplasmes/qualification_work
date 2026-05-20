import { skipToken } from '@reduxjs/toolkit/query';
import { RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import {
    useDeleteDatasetMutation,
    useListDatasetsQuery,
    type DatasetMetadata,
} from '@/features/datasets';
import { getApiErrorMessage } from '@/shared/api';
import { Button, ButtonLink } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatDate';

import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

import { DatasetChartBuilder } from './DatasetChartBuilder';
import { DatasetDetails } from './DatasetDetails';
import { DatasetPreview } from './DatasetPreview';
import { DatasetsUploadPanel } from './DatasetsUploadPanel';
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

export const DatasetsPage = () => {
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [datasetError, setDatasetError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(
        null
    );

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [deleteDataset, deleteState] = useDeleteDatasetMutation();

    const selectedDataset = useMemo(
        () => getSelectedDataset(datasetsQuery.data, selectedDatasetId),
        [datasetsQuery.data, selectedDatasetId]
    );

    const isPreparingWorkspace =
        meQuery.isLoading || Boolean(meQuery.data?.isInitializing && !org);

    const handleSelectDataset = (datasetId: string) => {
        setSelectedDatasetId(datasetId);
        setDatasetError('');
        setDeleteConfirmationId(null);
    };

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
            setSelectedDatasetId(null);
            setDeleteConfirmationId(null);
            await datasetsQuery.refetch();
        } catch (error) {
            setDatasetError(
                getApiErrorMessage(error, 'Unable to delete this dataset.')
            );
        }
    };

    const handleUploadSuccess = async (datasetId: string) => {
        setSelectedDatasetId(datasetId);
        await datasetsQuery.refetch();
    };

    if (meQuery.isError) {
        return (
            <div data-stack="v" data-gap="md" className={styles['empty']}>
                <p>Sign in to upload datasets.</p>
                <ButtonLink to="/sign-in">Sign in</ButtonLink>
            </div>
        );
    }

    if (isPreparingWorkspace) {
        return (
            <div data-stack="v" data-gap="md" className={styles['empty']}>
                <p>Preparing your workspace...</p>
            </div>
        );
    }

    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group direction="row">
                <WorkspaceGrid.Panel
                    initialSize="340px"
                    minSize="280px"
                    maxSize="440px"
                    className={styles['page']}
                >
                    <DatasetsUploadPanel org={org} onUploadSuccess={handleUploadSuccess} />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel
                    initialSize="1000px"
                    minSize="600px"
                    maxSize="1400px"
                    className={styles['page']}
                >
                    <main className={styles['main-panel']}>
                        <div className={styles['toolbar']}>
                            <div data-stack="v" data-gap="xs">
                                <span className={styles['eyebrow']}>Library</span>
                                <p className={styles['muted']}>
                                    {datasetsQuery.data?.length ?? 0} datasets
                                </p>
                            </div>
                            <Button
                                disabled={datasetsQuery.isFetching}
                                onClick={() => void datasetsQuery.refetch()}
                            >
                                <RefreshCcw size={18} />
                                Refresh
                            </Button>
                        </div>

                        <section
                            className={styles['dataset-list']}
                            aria-label="Datasets"
                        >
                            {datasetsQuery.isLoading && (
                                <div className={styles['status']}>
                                    Loading datasets...
                                </div>
                            )}
                            {datasetsQuery.data?.length === 0 && (
                                <div className={styles['empty']}>
                                    Upload a dataset to start.
                                </div>
                            )}
                            {datasetsQuery.data?.map(item => (
                                <button
                                    type="button"
                                    key={item.dataset.id}
                                    className={`${styles['dataset-item']} ${
                                        selectedDataset?.dataset.id === item.dataset.id
                                            ? styles['selected']
                                            : ''
                                    }`}
                                    onClick={() =>
                                        handleSelectDataset(item.dataset.id)
                                    }
                                >
                                    <div>
                                        <div className={styles['dataset-name']}>
                                            {item.dataset.name}
                                        </div>
                                        <div className={styles['dataset-meta']}>
                                            <span>{item.totalRows} rows</span>
                                            <span>
                                                {item.columns.length} columns
                                            </span>
                                            <span>
                                                {formatDate(item.dataset.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={styles['badge']}>
                                        {item.dataset.sourceType}
                                    </span>
                                </button>
                            ))}
                        </section>

                        {selectedDataset && (
                            <DatasetDetails
                                selectedDataset={selectedDataset}
                                deleteConfirmationId={deleteConfirmationId}
                                deleting={deleteState.isLoading}
                                error={datasetError}
                                onDelete={() => void handleDeleteDataset()}
                            />
                        )}

                        {selectedDataset && org && (
                            <DatasetChartBuilder
                                key={selectedDataset.dataset.id}
                                orgId={org.id}
                                selectedDataset={selectedDataset}
                            />
                        )}

                        <DatasetPreview
                            key={selectedDataset?.dataset.id ?? 'none'}
                            selectedDataset={selectedDataset}
                        />
                    </main>
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
