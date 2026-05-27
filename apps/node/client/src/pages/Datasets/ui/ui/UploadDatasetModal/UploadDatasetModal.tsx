import { Upload, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';

import {
    useMergeCancelMutation,
    useMergeCommitMutation,
    useMergePreviewMutation,
    useUploadDatasetMutation,
} from '@/features/uploadDataset';

import { getApiErrorMessage } from '@/shared/api';
import {
    Button,
    Dropzone,
    FormField,
    Modal,
    SegmentedTabs,
    StatusMessage,
    TextInput,
} from '@/shared/ui';

import { getDatasetName, getFileKey, getUniqueFiles, isDatasetFile } from './lib';

import styles from './UploadDatasetModal.module.scss';

type UploadMode = 'separate' | 'single';

type UploadDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    onUploadSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

const UPLOAD_MODE_OPTIONS = [
    { value: 'separate', label: 'Separate datasets' },
    { value: 'single', label: 'One dataset' },
] as const;

export const UploadDatasetModal = ({
    org,
    onUploadSuccess,
    onClose,
}: UploadDatasetModalProps) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadMode, setUploadMode] = useState<UploadMode>('separate');
    const [singleDatasetName, setSingleDatasetName] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadDataset, uploadState] = useUploadDatasetMutation();
    const [mergePreview, previewState] = useMergePreviewMutation();
    const [mergeCommit, commitState] = useMergeCommitMutation();
    const [mergeCancel] = useMergeCancelMutation();

    const isWorking =
        uploadState.isLoading || previewState.isLoading || commitState.isLoading;
    const singleModeActive = selectedFiles.length > 1 && uploadMode === 'single';
    const defaultDatasetName = getDatasetName(selectedFiles[0]?.name ?? '');

    const handleFiles = (files: File[]) => {
        setUploadError('');
        setUploadProgress('');

        if (files.length === 0) {
            return;
        }

        const acceptedFiles = files.filter(file => isDatasetFile(file));
        if (acceptedFiles.length !== files.length) {
            setUploadError('Only CSV and XLSX files can be selected.');
        }

        if (acceptedFiles.length === 0) {
            return;
        }

        setSelectedFiles(current => [
            ...current,
            ...getUniqueFiles(current, acceptedFiles),
        ]);
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setUploadError('');
        setUploadProgress('');
        setSelectedFiles(current =>
            current.filter(file => getFileKey(file) !== getFileKey(fileToRemove))
        );
    };

    const handleUpload = async () => {
        if (!org || selectedFiles.length === 0) {
            return;
        }

        if (singleModeActive) {
            await handleSingleDatasetUpload();

            return;
        }

        await handleSeparateDatasetUpload();
    };

    const handleSeparateDatasetUpload = async () => {
        if (!org || selectedFiles.length === 0) {
            return;
        }

        setUploadError('');
        setUploadProgress('');

        try {
            const uploadedIds: string[] = [];
            for (const [index, file] of selectedFiles.entries()) {
                setUploadProgress(
                    `Uploading ${index + 1} of ${selectedFiles.length}: ${file.name}`
                );
                const result = await uploadDataset({ orgId: org.id, file }).unwrap();
                uploadedIds.push(result.id);
            }

            resetUploadState();
            await onUploadSuccess(uploadedIds[uploadedIds.length - 1]);
            onClose();
        } catch (error) {
            setUploadError(getApiErrorMessage(error, 'Unable to upload this dataset.'));
            setUploadProgress('');
        }
    };

    const handleSingleDatasetUpload = async () => {
        if (!org || selectedFiles.length === 0) {
            return;
        }

        setUploadError('');
        setUploadProgress('Checking file schemas...');
        let sessionId: string | null = null;

        try {
            const preview = await mergePreview({
                orgId: org.id,
                name: singleDatasetName.trim() || defaultDatasetName,
                mode: 'append',
                createNew: true,
                mergeKeys: [],
                files: selectedFiles,
            }).unwrap();
            sessionId = preview.sessionId;
            setUploadProgress('Creating dataset...');

            const result = await mergeCommit({ sessionId, orgId: org.id }).unwrap();
            sessionId = null;
            resetUploadState();
            await onUploadSuccess(result.datasetId);
            onClose();
        } catch (error) {
            if (sessionId) {
                void mergeCancel(sessionId);
            }
            setUploadError(getApiErrorMessage(error, 'Unable to upload these files.'));
            setUploadProgress('');
        }
    };

    const resetUploadState = () => {
        setSelectedFiles([]);
        setSingleDatasetName('');
        setUploadMode('separate');
        setUploadProgress('');
    };

    const buttonLabel = singleModeActive
        ? 'Create one dataset'
        : selectedFiles.length > 1
          ? 'Upload datasets'
          : 'Upload dataset';

    return (
        <Modal title="Upload dataset" onClose={onClose}>
            <Dropzone
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Dataset file"
                multiple
                onFiles={handleFiles}
            >
                <UploadCloud size={28} />
                <strong>Drop CSV or XLSX files</strong>
                <span className={styles['muted']}>
                    Wide files are fine. The first rows are used for type inference.
                </span>
            </Dropzone>

            {selectedFiles.length > 1 && (
                <div className={styles['mode-section']}>
                    <span className={styles['section-title']}>Upload mode</span>
                    <SegmentedTabs
                        value={uploadMode}
                        columns={2}
                        options={UPLOAD_MODE_OPTIONS}
                        disabled={isWorking}
                        onChange={setUploadMode}
                    />
                    {uploadMode === 'single' && (
                        <FormField
                            label="Dataset name"
                            hint={`Default: ${defaultDatasetName}`}
                        >
                            <TextInput
                                type="text"
                                placeholder={defaultDatasetName}
                                value={singleDatasetName}
                                disabled={isWorking}
                                onChange={event =>
                                    setSingleDatasetName(event.currentTarget.value)
                                }
                            />
                        </FormField>
                    )}
                    {uploadMode === 'single' && (
                        <span className={styles['schema-note']}>
                            Same column names and data types required.
                        </span>
                    )}
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className={styles['file-list']} aria-label="Selected files">
                    {selectedFiles.map(file => (
                        <span key={getFileKey(file)} className={styles['file-chip']}>
                            <span className={styles['file-name']}>{file.name}</span>
                            <button
                                type="button"
                                className={styles['remove-file']}
                                aria-label={`Remove ${file.name}`}
                                disabled={isWorking}
                                onClick={() => handleRemoveFile(file)}
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {uploadProgress && <StatusMessage>{uploadProgress}</StatusMessage>}

            {uploadError && <StatusMessage tone="error">{uploadError}</StatusMessage>}

            <Button
                disabled={selectedFiles.length === 0 || !org || isWorking}
                isLoading={isWorking}
                onClick={() => void handleUpload()}
            >
                <Upload size={18} />
                {buttonLabel}
            </Button>
        </Modal>
    );
};
