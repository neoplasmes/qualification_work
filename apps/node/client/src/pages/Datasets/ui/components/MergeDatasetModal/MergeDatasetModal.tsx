import { GitMerge } from 'lucide-react';
import { useState } from 'react';

import {
    useMergeCancelMutation,
    useMergeCommitMutation,
    useMergePreviewMutation,
    type MergePreviewResult,
} from '@/features/uploadDataset';

import type { DatasetMetadata } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import {
    Button,
    Checkbox,
    FormField,
    Modal,
    StatusMessage,
    TextInput,
} from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './MergeDatasetModal.module.scss';

type MergeDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    selectedDataset: DatasetMetadata | undefined;
    onSuccess: () => Promise<void>;
    onClose: () => void;
};

type Step = 'setup' | 'preview';

export const MergeDatasetModal = ({
    org,
    selectedDataset,
    onSuccess,
    onClose,
}: MergeDatasetModalProps) => {
    const [step, setStep] = useState<Step>('setup');
    const [targetMode, setTargetMode] = useState<'existing' | 'new'>(
        selectedDataset ? 'existing' : 'new'
    );
    const [newDatasetName, setNewDatasetName] = useState('');
    const [selectedMergeKeys, setSelectedMergeKeys] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [previewResult, setPreviewResult] = useState<MergePreviewResult | null>(null);
    const [error, setError] = useState('');

    const [mergePreview, previewState] = useMergePreviewMutation();
    const [mergeCommit, commitState] = useMergeCommitMutation();
    const [mergeCancel] = useMergeCancelMutation();

    const availableColumns = selectedDataset?.columns ?? [];
    const canPreview =
        files.length > 0 &&
        !!org &&
        (targetMode === 'new'
            ? newDatasetName.trim().length > 0
            : selectedMergeKeys.length > 0);

    const handlePreview = async () => {
        if (!org) {
            return;
        }

        setError('');
        try {
            const result = await mergePreview({
                orgId: org.id,
                datasetId:
                    targetMode === 'existing' ? selectedDataset?.dataset.id : undefined,
                name: targetMode === 'new' ? newDatasetName.trim() : undefined,
                mergeKeys: selectedMergeKeys,
                files,
            }).unwrap();
            setPreviewResult(result);
            setStep('preview');
        } catch (e) {
            setError(getApiErrorMessage(e, 'Preview failed.'));
        }
    };

    const handleConfirm = async () => {
        if (!previewResult || !org) {
            return;
        }

        setError('');
        try {
            await mergeCommit({
                sessionId: previewResult.sessionId,
                orgId: org.id,
            }).unwrap();
            await onSuccess();
            onClose();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Commit failed.'));
        }
    };

    const handleBackToSetup = () => {
        if (previewResult) {
            void mergeCancel(previewResult.sessionId);
            setPreviewResult(null);
        }
        setError('');
        setStep('setup');
    };

    const handleClose = () => {
        if (previewResult) {
            void mergeCancel(previewResult.sessionId);
        }
        onClose();
    };

    const toggleMergeKey = (key: string) => {
        setSelectedMergeKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const hasConflicts = (previewResult?.statistics.conflicts.length ?? 0) > 0;

    return (
        <Modal title="Merge data" onClose={handleClose}>
            {step === 'setup' && (
                <>
                    {selectedDataset && (
                        <div className={styles['merge-target-options']}>
                            <label className={styles['merge-target-option']}>
                                <input
                                    type="radio"
                                    checked={targetMode === 'existing'}
                                    onChange={() => setTargetMode('existing')}
                                />
                                Add to &quot;{selectedDataset.dataset.name}&quot;
                            </label>
                            <label className={styles['merge-target-option']}>
                                <input
                                    type="radio"
                                    checked={targetMode === 'new'}
                                    onChange={() => setTargetMode('new')}
                                />
                                Create new dataset
                            </label>
                        </div>
                    )}

                    {targetMode === 'new' && (
                        <FormField label="Dataset name">
                            <TextInput
                                data-test-id={datasetsTestIds.mergeDatasetNameInput}
                                type="text"
                                placeholder="My dataset"
                                value={newDatasetName}
                                onChange={e => setNewDatasetName(e.target.value)}
                            />
                        </FormField>
                    )}

                    {targetMode === 'existing' && availableColumns.length > 0 && (
                        <div className={styles['merge-keys-section']}>
                            <span>Merge keys</span>
                            <div className={styles['merge-keys-list']}>
                                {availableColumns.map(col => (
                                    <Checkbox
                                        key={col.id}
                                        className={styles['merge-key-option']}
                                        label={col.displayName}
                                        checked={selectedMergeKeys.includes(col.key)}
                                        onChange={() => toggleMergeKey(col.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles['file-picker']}>
                        <span className={styles['file-picker-label']}>
                            Files (CSV or XLSX)
                        </span>
                        <input
                            data-test-id={datasetsTestIds.mergeFileInput}
                            type="file"
                            multiple
                            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className={styles['file-picker-input']}
                            onChange={e =>
                                setFiles(Array.from(e.currentTarget.files ?? []))
                            }
                        />
                        {files.length > 0 && (
                            <span className={styles['file-names']}>
                                {files.map(f => f.name).join(', ')}
                            </span>
                        )}
                    </div>

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <Button
                        data-test-id={datasetsTestIds.mergePreviewButton}
                        disabled={!canPreview || previewState.isLoading}
                        isLoading={previewState.isLoading}
                        onClick={() => void handlePreview()}
                    >
                        <GitMerge size={18} />
                        Preview
                    </Button>
                </>
            )}

            {step === 'preview' && previewResult && (
                <>
                    <dl className={styles['merge-stats']}>
                        <div className={styles['merge-stat']}>
                            <dt>New rows</dt>
                            <dd>{previewResult.statistics.totalNewRows}</dd>
                        </div>
                        <div className={styles['merge-stat']}>
                            <dt>Duplicates</dt>
                            <dd>{previewResult.statistics.totalDuplicateRows}</dd>
                        </div>
                    </dl>

                    {previewResult.statistics.newColumns.length > 0 && (
                        <div>
                            <span className={styles['file-picker-label']}>
                                New columns
                            </span>
                            <div className={styles['columns-list']}>
                                {previewResult.statistics.newColumns.map(col => (
                                    <div key={col.key} className={styles['column-chip']}>
                                        <span>{col.displayName}</span>
                                        <small>{col.dataType}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasConflicts && (
                        <div className={styles['merge-conflicts-wrap']}>
                            <span className={styles['merge-conflicts-title']}>
                                Conflicts ({previewResult.statistics.conflicts.length}) -
                                cannot commit
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
                                    {previewResult.statistics.conflicts.map((c, i) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <tr key={i}>
                                            <td>{c.column}</td>
                                            <td>{String(c.oldValue ?? '')}</td>
                                            <td>{String(c.newValue ?? '')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <div className={styles['modal-actions']}>
                        <Button variant="danger" onClick={handleBackToSetup}>
                            Back
                        </Button>
                        <Button
                            data-test-id={datasetsTestIds.mergeConfirmButton}
                            disabled={hasConflicts || commitState.isLoading}
                            isLoading={commitState.isLoading}
                            onClick={() => void handleConfirm()}
                        >
                            Confirm
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};
