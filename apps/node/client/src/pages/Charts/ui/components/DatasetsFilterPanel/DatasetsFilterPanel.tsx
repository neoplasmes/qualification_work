import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { IconButton } from '@/shared/ui';

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

        <div className={styles['dataset-filter-list']}>
            {!datasets && <div className={styles['status']}>Loading...</div>}
            {datasets?.length === 0 && (
                <div className={styles['empty']}>No datasets yet.</div>
            )}
            {datasets?.map(item => (
                <button
                    type="button"
                    key={item.dataset.id}
                    className={`${styles['dataset-chip']} ${
                        selectedIds.includes(item.dataset.id) ? styles['selected'] : ''
                    }`}
                    onClick={() => onToggle(item.dataset.id)}
                >
                    <div className={styles['dataset-chip-name']}>{item.dataset.name}</div>
                    <div className={styles['dataset-chip-meta']}>
                        <span>{item.totalRows} rows</span>
                        <span>{formatDate(item.dataset.createdAt)}</span>
                    </div>
                </button>
            ))}
        </div>
    </aside>
);
