import type { DatasetColumn } from '@/core/entities/datasetColumn';

import styles from './mergeKeyChips.module.css';

type MergeKeyChipsProps = {
    columns: DatasetColumn[];
    disabled?: boolean;
    selectedKeys: string[];
    onToggle: (key: string) => void;
};

export const MergeKeyChips = ({
    columns,
    disabled,
    selectedKeys,
    onToggle,
}: MergeKeyChipsProps) => (
    <div className={styles['chips']}>
        {columns.map(column => {
            const selected = selectedKeys.includes(column.key);

            return (
                <button
                    key={column.id}
                    type="button"
                    disabled={disabled}
                    className={styles['chip']}
                    data-px="sm"
                    data-py="xs"
                    data-selected={selected || undefined}
                    aria-label={column.displayName}
                    aria-pressed={selected}
                    onClick={() => onToggle(column.key)}
                >
                    <span className={styles['name']}>{column.displayName}</span>
                    <span className={styles['type']}>{column.dataType}</span>
                </button>
            );
        })}
    </div>
);
