import { WorkspaceModeTabs } from '@/ui/widgets/WorkspaceModeTabs';
import { Button, Field } from '@qualification-work/design-system';
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
import { Modal, StatusMessage } from '@/shared/ui';

import { datasetsTestIds } from '../../const';
import {
    defaultMergeDatasetDraft,
    mergeDatasetConfig,
    mergeDatasetFilesBind,
    mergeDatasetKeysBind,
    mergeDatasetModeBind,
    type MergeDatasetDraft,
} from './model';
import { MergeFilesSection, MergeKeyChips, MergePreviewStep } from './ui';

import styles from './MergeDatasetModal.module.css';

type MergeDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    selectedDataset: DatasetMetadata;
    onSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

type Step = 'setup' | 'preview';

const importModeTabs = [
    { value: 'append', label: 'Append rows' },
    { value: 'merge', label: 'Merge by key' },
] as const;

export const MergeDatasetModal = ({
    org,
    selectedDataset,
    onSuccess,
    onClose,
}: MergeDatasetModalProps) => {
    const [step, setStep] = useState<Step>('setup');
    const [draft, setDraft] = useState<MergeDatasetDraft>({
        ...defaultMergeDatasetDraft,
        files: [],
        selectedMergeKeys: [],
    });
    const [previewResult, setPreviewResult] = useState<MergePreviewResult | null>(null);
    const [error, setError] = useState('');

    const [mergePreview, previewState] = useMergePreviewMutation();
    const [mergeCommit, commitState] = useMergeCommitMutation();
    const [mergeCancel] = useMergeCancelMutation();

    const fallbackDatasetName = `${selectedDataset.dataset.name} copy`;
    const canPreview =
        draft.files.length > 0 &&
        !!org &&
        (draft.mode === 'append' || draft.selectedMergeKeys.length > 0);

    const handlePreview = async () => {
        if (!org) {
            return;
        }

        setError('');
        try {
            const result = await mergePreview({
                orgId: org.id,
                datasetId: selectedDataset.dataset.id,
                name: draft.createNew
                    ? draft.newDatasetName.trim() || fallbackDatasetName
                    : undefined,
                mode: draft.mode,
                createNew: draft.createNew,
                mergeKeys: draft.mode === 'merge' ? draft.selectedMergeKeys : [],
                files: draft.files,
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

    const previewAction =
        step === 'setup' ? (
            <Button
                data-px="sm"
                data-py="xs"
                data-test-id={datasetsTestIds.mergePreviewButton}
                disabled={!canPreview || previewState.isLoading || previewState.isLoading}
                aria-busy={previewState.isLoading}
                onClick={() => void handlePreview()}
            >
                <GitMerge size={18} />
                Preview
            </Button>
        ) : null;

    return (
        <Modal
            title="Merge data"
            size="md"
            padding="md"
            height={560}
            actions={previewAction}
            onClose={handleClose}
        >
            {step === 'setup' && (
                <mergeDatasetConfig.Root
                    className={styles['content']}
                    value={draft}
                    onChange={setDraft}
                >
                    <mergeDatasetConfig.InputPropRenderer bind={mergeDatasetModeBind}>
                        {mode => (
                            <WorkspaceModeTabs
                                value={mode.value}
                                columns={2}
                                options={importModeTabs}
                                layoutId="merge-dataset-mode"
                                onChange={mode.setValue}
                            />
                        )}
                    </mergeDatasetConfig.InputPropRenderer>

                    <mergeDatasetConfig.Section name="Files">
                        <mergeDatasetConfig.InputPropRenderer
                            bind={mergeDatasetFilesBind}
                        >
                            {files => (
                                <MergeFilesSection
                                    files={files.value}
                                    onFilesChange={files.setValue}
                                />
                            )}
                        </mergeDatasetConfig.InputPropRenderer>
                    </mergeDatasetConfig.Section>

                    {draft.mode === 'merge' && selectedDataset.columns.length > 0 && (
                        <mergeDatasetConfig.Section name="Merge keys">
                            <mergeDatasetConfig.InputPropRenderer
                                bind={mergeDatasetKeysBind}
                            >
                                {mergeKeys => (
                                    <MergeKeyChips
                                        columns={selectedDataset.columns}
                                        selectedKeys={mergeKeys.value}
                                        onToggle={key =>
                                            mergeKeys.setValue(current =>
                                                current.includes(key)
                                                    ? current.filter(k => k !== key)
                                                    : [...current, key]
                                            )
                                        }
                                    />
                                )}
                            </mergeDatasetConfig.InputPropRenderer>
                        </mergeDatasetConfig.Section>
                    )}

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <mergeDatasetConfig.Section
                        name="Create new dataset"
                        explain="Copy current rows first, then apply imported rows."
                        enabledField="createNew"
                    >
                        <Field
                            label="Dataset name"
                            description={`Leave empty to use "${fallbackDatasetName}".`}
                        >
                            <mergeDatasetConfig.Input
                                data-test-id={datasetsTestIds.mergeDatasetNameInput}
                                field="newDatasetName"
                                type="text"
                                placeholder={fallbackDatasetName}
                            />
                        </Field>
                    </mergeDatasetConfig.Section>
                </mergeDatasetConfig.Root>
            )}

            {step === 'preview' && previewResult && (
                <MergePreviewStep
                    mode={draft.mode}
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
