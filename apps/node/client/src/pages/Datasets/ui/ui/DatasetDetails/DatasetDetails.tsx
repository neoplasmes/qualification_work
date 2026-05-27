import { GitMerge, Trash2 } from 'lucide-react';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, StatusMessage, Table } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './DatasetDetails.module.scss';

type DatasetDetailsProps = {
    selectedDataset: DatasetMetadata;
    deleteConfirmationId: string | null;
    deleting: boolean;
    renaming: boolean;
    error: string;
    onDelete: () => void;
    onMerge: () => void;
    onRename: (name: string) => Promise<void> | void;
};

export const DatasetDetails = ({
    selectedDataset,
    deleteConfirmationId,
    deleting,
    renaming,
    error,
    onDelete,
    onMerge,
    onRename,
}: DatasetDetailsProps) => (
    <section className={styles['details']} data-flex aria-label="Dataset details">
        <div className={styles['details-header']}>
            <WorkspaceTitleEditor
                title={selectedDataset.dataset.name}
                fallbackTitle="Untitled dataset"
                saving={renaming}
                editButtonTestId={datasetsTestIds.renameButton}
                inputTestId={datasetsTestIds.renameInput}
                onRename={onRename}
            />
            <div className={styles['details-actions']}>
                <Button onClick={onMerge}>
                    <GitMerge size={18} />
                    Merge data
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

        <div className={styles['delete-actions']}>
            <Button variant="danger" disabled={deleting} onClick={onDelete}>
                <Trash2 size={18} />
                {deleteConfirmationId === selectedDataset.dataset.id
                    ? 'Confirm delete'
                    : 'Delete'}
            </Button>
        </div>
    </section>
);
