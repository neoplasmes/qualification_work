import { Trash2 } from 'lucide-react';

import type { DatasetMetadata } from '@/features/datasets';
import { Button } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatDate';

import styles from './DatasetsPage.module.scss';

type DatasetDetailsProps = {
    selectedDataset: DatasetMetadata;
    deleteConfirmationId: string | null;
    deleting: boolean;
    error: string;
    onDelete: () => void;
};

export const DatasetDetails = ({
    selectedDataset,
    deleteConfirmationId,
    deleting,
    error,
    onDelete,
}: DatasetDetailsProps) => (
    <section className={styles['details']} aria-label="Dataset details">
        <div className={styles['details-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Dataset</span>
                <h2 className={styles['detail-title']}>
                    {selectedDataset.dataset.name}
                </h2>
            </div>
            <Button variant="danger" disabled={deleting} onClick={onDelete}>
                <Trash2 size={18} />
                {deleteConfirmationId === selectedDataset.dataset.id
                    ? 'Confirm delete'
                    : 'Delete'}
            </Button>
        </div>

        {error && (
            <div
                role="alert"
                className={`${styles['status']} ${styles['error']}`}
            >
                {error}
            </div>
        )}

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
