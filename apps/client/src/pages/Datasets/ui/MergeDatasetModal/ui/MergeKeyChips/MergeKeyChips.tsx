import type { DatasetColumn } from '@/entities/dataset';

import styles from './MergeKeyChips.module.scss';

type MergeKeyChipsProps = {
    columns: DatasetColumn[];
    selectedKeys: string[];
    onToggle: (key: string) => void;
};

export const MergeKeyChips = ({
    columns,
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
