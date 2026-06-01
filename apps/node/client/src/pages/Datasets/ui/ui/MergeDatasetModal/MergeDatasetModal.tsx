import { GitMerge } from 'lucide-react';
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
import { Button, Modal, StatusMessage } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import { MergePreviewStep } from './MergePreviewStep';
import { CreateNewDatasetSection, MergeFilesSection, MergeKeyChips } from './ui';

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

    const previewAction =
        step === 'setup' ? (
            <Button
                data-px="sm"
                data-py="xs"
                data-test-id={datasetsTestIds.mergePreviewButton}
                disabled={!canPreview || previewState.isLoading}
                isLoading={previewState.isLoading}
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
                <div className={styles['content']} data-stack="v" data-gap="md">
                    {selectedDataset && (
                        <div>
                            <WorkspaceModeTabs
                                value={mode}
                                columns={2}
                                options={IMPORT_MODE_TABS}
                                layoutId="merge-dataset-mode"
                                onChange={setMode}
                            />
                        </div>
                    )}

                    <MergeFilesSection files={files} onFilesChange={setFiles} />

                    {mode === 'merge' && availableColumns.length > 0 && (
                        <MergeKeyChips
                            columns={availableColumns}
                            selectedKeys={selectedMergeKeys}
                            onToggle={toggleMergeKey}
                        />
                    )}

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <CreateNewDatasetSection
                        checked={createNew}
                        datasetName={newDatasetName}
                        placeholderName={selectedDataset?.dataset.name ?? 'Dataset'}
                        onCheckedChange={setCreateNew}
                        onDatasetNameChange={setNewDatasetName}
                    />
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
