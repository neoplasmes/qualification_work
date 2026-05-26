import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import {
    EmptyState,
    FilterChip,
    IconButton,
    SelectableList,
    StatusMessage,
} from '@/shared/ui';

import styles from './DatasetsFilterPanel.module.scss';

type DatasetsFilterPanelProps = {
    datasets: DatasetMetadata[] | undefined;
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
};

export const DatasetsFilterPanel = ({
    datasets,
    selectedIds,
    onToggle,
    onClear,
}: DatasetsFilterPanelProps) => (
    <aside className={styles['panel']}>
        <div data-stack="h" data-align="center" data-justify="between">
            <span className={styles['eyebrow']}>Filter by dataset</span>
            <IconButton
                aria-label="Clear dataset filter"
                style={{ visibility: selectedIds.length > 0 ? 'visible' : 'hidden' }}
                onClick={onClear}
            >
                <X size={16} />
            </IconButton>
        </div>

        <SelectableList>
            {!datasets && <StatusMessage centered>Loading...</StatusMessage>}
            {datasets?.length === 0 && <EmptyState>No datasets yet.</EmptyState>}
            {datasets?.map(item => (
                <FilterChip
                    key={item.dataset.id}
                    selected={selectedIds.includes(item.dataset.id)}
                    label={item.dataset.name}
                    meta={
                        <>
                            <span>{item.totalRows} rows</span>
                            <span>{formatDate(item.dataset.createdAt)}</span>
                        </>
                    }
                    onClick={() => onToggle(item.dataset.id)}
                />
            ))}
        </SelectableList>
    </aside>
);
