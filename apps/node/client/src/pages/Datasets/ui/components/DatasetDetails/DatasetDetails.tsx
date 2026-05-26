import { GitMerge, Trash2 } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, EntityHeader, SectionHeader, StatusMessage } from '@/shared/ui';

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
        <EntityHeader
            eyebrow="Dataset"
            title={selectedDataset.dataset.name}
            actions={
                <>
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
                </>
            }
        />

        {error && <StatusMessage tone="error">{error}</StatusMessage>}

        <dl className={styles['stats']}>
            <div>
                <dt>Rows</dt>
                <dd>{selectedDataset.totalRows}</dd>
            </div>
            <div>
                <dt>Columns</dt>
                <dd>{selectedDataset.columns.length}</dd>
            </div>
            <div>
                <dt>Source</dt>
                <dd>{selectedDataset.dataset.sourceType}</dd>
            </div>
            <div>
                <dt>Created</dt>
                <dd>{formatDate(selectedDataset.dataset.createdAt)}</dd>
            </div>
        </dl>

        <SectionHeader eyebrow="Columns" />
        <div className={styles['columns-list']} aria-label="Dataset columns">
            {selectedDataset.columns.map(column => (
                <div key={column.id} className={styles['column-chip']}>
                    <span>{column.displayName}</span>
                    <small>{column.dataType}</small>
                </div>
            ))}
        </div>
    </section>
);
