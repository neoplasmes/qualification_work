import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/features/datasets';

import { formatDate } from '@/shared/lib/formatDate';

import styles from './ChartsPage.module.scss';

type CreateChartModalProps = {
    datasets: DatasetMetadata[] | undefined;
    onSelect: (dataset: DatasetMetadata) => void;
    onClose: () => void;
};

export const CreateChartModal = ({ datasets, onSelect, onClose }: CreateChartModalProps) => (
    <div
        className={styles['modal-backdrop']}
        role="dialog"
        aria-modal="true"
        aria-label="Select dataset"
        onClick={onClose}
    >
        <div className={styles['modal']} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
                <span className={styles['modal-title']}>Select dataset</span>
                <button
                    type="button"
                    className={styles['modal-close']}
                    aria-label="Close"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <div className={styles['modal-list']}>
                {!datasets && <div className={styles['status']}>Loading...</div>}
                {datasets?.length === 0 && (
                    <div className={styles['empty']}>No datasets. Upload one first.</div>
                )}
                {datasets?.map(item => (
                    <button
                        type="button"
                        key={item.dataset.id}
                        className={styles['modal-dataset-item']}
                        onClick={() => onSelect(item)}
                    >
                        <div className={styles['dataset-chip-name']}>
                            {item.dataset.name}
                        </div>
                        <div className={styles['dataset-chip-meta']}>
                            <span>{item.totalRows} rows</span>
                            <span>{item.columns.length} columns</span>
                            <span>{formatDate(item.dataset.createdAt)}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
);
