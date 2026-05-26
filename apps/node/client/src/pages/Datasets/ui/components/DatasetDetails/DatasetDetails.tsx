import { GitMerge, Trash2 } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, StatusMessage, Table } from '@/shared/ui';

import styles from './DatasetDetails.module.scss';

type DatasetDetailsProps = {
    selectedDataset: DatasetMetadata;
    deleteConfirmationId: string | null;
    deleting: boolean;
    error: string;
    onDelete: () => void;
    onMerge: () => void;
};

export const DatasetDetails = ({
    selectedDataset,
    deleteConfirmationId,
    deleting,
    error,
    onDelete,
    onMerge,
}: DatasetDetailsProps) => (
    <section className={styles['details']} aria-label="Dataset details">
        <div className={styles['details-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Dataset</span>
                <h2 className={styles['detail-title']}>{selectedDataset.dataset.name}</h2>
            </div>
            <div className={styles['details-actions']}>
                <Button onClick={onMerge}>
                    <GitMerge size={18} />
                    Merge data
                </Button>
                <Button variant="danger" disabled={deleting} onClick={onDelete}>
                    <Trash2 size={18} />
                    {deleteConfirmationId === selectedDataset.dataset.id
                        ? 'Confirm delete'
                        : 'Delete'}
                </Button>
            </div>
        </div>

        {error && <StatusMessage tone="error">{error}</StatusMessage>}

        <Table
            aria-label="Dataset properties"
            headers={{ key: 'Property', value: 'Value' }}
            rows={[
                { key: 'Rows', value: selectedDataset.totalRows },
                { key: 'Columns', value: selectedDataset.columns.length },
                { key: 'Source', value: selectedDataset.dataset.sourceType },
                { key: 'Created', value: formatDate(selectedDataset.dataset.createdAt) },
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
    </section>
);
