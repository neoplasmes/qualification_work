import { GitMerge, Upload } from 'lucide-react';
import { useState } from 'react';

import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';

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

import { MergePreviewStep } from './MergePreviewStep';

import styles from './MergeDatasetModal.module.scss';

type MergeDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    selectedDataset: DatasetMetadata | undefined;
    onSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

type Step = 'setup' | 'preview';
type ImportMode = 'append' | 'merge';

const IMPORT_MODE_TABS = [
    { value: 'append', label: 'Append rows' },
    { value: 'merge', label: 'Merge by key' },
] as const satisfies readonly WorkspaceModeTabOption<ImportMode>[];

export const MergeDatasetModal = ({
    org,
    selectedDataset,
    onSuccess,
    onClose,
}: MergeDatasetModalProps) => {
    const [step, setStep] = useState<Step>('setup');
    const [mode, setMode] = useState<ImportMode>('append');
    const [createNew, setCreateNew] = useState(false);
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
        !!selectedDataset &&
        (mode === 'append' || selectedMergeKeys.length > 0);

    const handlePreview = async () => {
        if (!org) {
            return;
        }

        setError('');
        try {
            const result = await mergePreview({
                orgId: org.id,
                datasetId: selectedDataset?.dataset.id,
                name: createNew ? newDatasetName.trim() : undefined,
                mode,
                createNew,
                mergeKeys: mode === 'merge' ? selectedMergeKeys : [],
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
            const result = await mergeCommit({
                sessionId: previewResult.sessionId,
                orgId: org.id,
            }).unwrap();
            await onSuccess(result.datasetId);
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

    return (
        <Modal title="Merge data" size="md" height={560} onClose={handleClose}>
            {step === 'setup' && (
                <div className={styles['content']} data-stack="v" data-gap="md">
                    {selectedDataset && (
                        <div data-stack="v" data-gap="xs">
                            <span className={styles['section-title']}>Mode</span>
                            <WorkspaceModeTabs
                                value={mode}
                                columns={2}
                                options={IMPORT_MODE_TABS}
                                layoutId="merge-dataset-mode"
                                onChange={setMode}
                            />
                        </div>
                    )}

                    <Checkbox
                        label="Create new dataset"
                        description="Copy current rows first, then apply imported rows."
                        inline
                        checked={createNew}
                        onChange={event => setCreateNew(event.currentTarget.checked)}
                    />

                    {createNew && (
                        <FormField
                            label="Dataset name"
                            hint={`Leave empty to use "${selectedDataset?.dataset.name ?? 'Dataset'} copy".`}
                        >
                            <TextInput
                                data-test-id={datasetsTestIds.mergeDatasetNameInput}
                                type="text"
                                placeholder={`${selectedDataset?.dataset.name ?? 'Dataset'} copy`}
                                value={newDatasetName}
                                onChange={e => setNewDatasetName(e.target.value)}
                            />
                        </FormField>
                    )}

                    {mode === 'merge' && availableColumns.length > 0 && (
                        <div className={styles['merge-keys-section']}>
                            <span className={styles['section-title']}>Merge keys</span>
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
                        <span className={styles['section-title']}>Files</span>
                        <label className={styles['file-picker-control']}>
                            <Upload size={20} />
                            <span>Choose CSV or XLSX files</span>
                            <small>Multiple files can be selected at once.</small>
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
                        </label>
                        {files.length > 0 && (
                            <div className={styles['file-names']}>
                                {files.map(file => (
                                    <span key={`${file.name}-${file.size}`}>
                                        {file.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <Button
                        data-test-id={datasetsTestIds.mergePreviewButton}
                        disabled={!canPreview || previewState.isLoading}
                        isLoading={previewState.isLoading}
                        className={styles['primary-action']}
                        onClick={() => void handlePreview()}
                    >
                        <GitMerge size={18} />
                        Preview
                    </Button>
                </div>
            )}

            {step === 'preview' && previewResult && (
                <MergePreviewStep
                    mode={mode}
                    previewResult={previewResult}
                    error={error}
                    committing={commitState.isLoading}
                    onBack={handleBackToSetup}
                    onConfirm={() => void handleConfirm()}
                />
            )}
        </Modal>
    );
};
