import { ArrowLeft, Check, Rows3 } from 'lucide-react';

import type { MergePreviewResult } from '@/features/uploadDataset';

import { Button, StatusMessage } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './MergeDatasetModal.module.scss';

type MergePreviewStepProps = {
    mode: 'append' | 'merge';
    previewResult: MergePreviewResult;
    error: string;
    committing: boolean;
    onBack: () => void;
    onConfirm: () => void;
};

export const MergePreviewStep = ({
    mode,
    previewResult,
    error,
    committing,
    onBack,
    onConfirm,
}: MergePreviewStepProps) => {
    const hasConflicts = previewResult.conflicts.length > 0;

    return (
        <div className={styles['content']} data-stack="v" data-gap="md">
            <dl className={styles['merge-stats']}>
                <div className={styles['merge-stat']}>
                    <dt>{mode === 'append' ? 'Rows to append' : 'New rows'}</dt>
                    <dd>{previewResult.statistics.totalNewRows}</dd>
                </div>
                {mode === 'append' ? (
                    <div className={styles['merge-stat']}>
                        <dt>Incoming rows</dt>
                        <dd>{previewResult.statistics.totalIncomingRows}</dd>
                    </div>
                ) : (
                    <div className={styles['merge-stat']}>
                        <dt>Matched rows</dt>
                        <dd>{previewResult.statistics.totalDuplicateRows}</dd>
                    </div>
                )}
                {previewResult.statistics.copiedRows > 0 && (
                    <div className={styles['merge-stat']}>
                        <dt>Copied rows</dt>
                        <dd>{previewResult.statistics.copiedRows}</dd>
                    </div>
                )}
            </dl>

            {previewResult.statistics.newColumns.length > 0 && (
                <div data-stack="v" data-gap="xs">
                    <span className={styles['section-title']}>New columns</span>
                    <div className={styles['columns-list']}>
                        {previewResult.statistics.newColumns.map(col => (
                            <div key={col.key} className={styles['column-chip']}>
                                <span>{col.displayName ?? col.key}</span>
                                <small>{col.dataType}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasConflicts && (
                <div className={styles['merge-conflicts-wrap']}>
                    <span className={styles['merge-conflicts-title']}>
                        Conflicts ({previewResult.conflicts.length}) - cannot commit
                    </span>
                    <table className={styles['merge-conflicts-table']}>
                        <thead>
                            <tr>
                                <th>Column</th>
                                <th>Old</th>
                                <th>New</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewResult.conflicts.map((conflict, index) => (
                                <tr key={`${conflict.column}-${index}`}>
                                    <td>{conflict.column}</td>
                                    <td>{String(conflict.oldValue ?? '')}</td>
                                    <td>{String(conflict.newValue ?? '')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && <StatusMessage tone="error">{error}</StatusMessage>}

            <div className={styles['modal-actions']}>
                <Button tone="ghost" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back
                </Button>
                <Button
                    data-test-id={datasetsTestIds.mergeConfirmButton}
                    disabled={hasConflicts || committing}
                    isLoading={committing}
                    onClick={onConfirm}
                >
                    {mode === 'append' ? <Rows3 size={18} /> : <Check size={18} />}
                    Confirm
                </Button>
            </div>
        </div>
    );
};
