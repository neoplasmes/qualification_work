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
    IconButton,
    Modal,
    SegmentedTabs,
    StatusMessage,
    TextInput,
} from '@/shared/ui';

import styles from './UploadDatasetModal.module.scss';

type UploadMode = 'separate' | 'single';

type UploadDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    onUploadSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

const uploadModeOptions = [
    { value: 'separate', label: 'Separate datasets' },
    { value: 'single', label: 'One dataset' },
] as const;

const datasetFileExtensionRe = /\.(csv|xlsx)$/i;
const filenameExtensionRe = /\.[^/.]+$/;

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

    const isLoading =
        uploadState.isLoading || previewState.isLoading || commitState.isLoading;
    const singleModeActive = selectedFiles.length > 1 && uploadMode === 'single';
    const defaultDatasetName =
        selectedFiles[0]?.name.replace(filenameExtensionRe, '') || 'dataset';

    const handleFiles = (files: File[]) => {
        setUploadError('');
        setUploadProgress('');

        if (files.length === 0) {
            return;
        }

        const acceptedFiles = files.filter(file =>
            datasetFileExtensionRe.test(file.name)
        );
        if (acceptedFiles.length !== files.length) {
            setUploadError('Only CSV and XLSX files can be selected.');
        }

        if (acceptedFiles.length === 0) {
            return;
        }

        setSelectedFiles(current => {
            const selectedFileKeys = new Set(
                current.map(file => `${file.name}-${file.size}-${file.lastModified}`)
            );

            return [
                ...current,
                ...acceptedFiles.filter(
                    file =>
                        !selectedFileKeys.has(
                            `${file.name}-${file.size}-${file.lastModified}`
                        )
                ),
            ];
        });
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setUploadError('');
        setUploadProgress('');
        const fileToRemoveKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
        setSelectedFiles(current =>
            current.filter(
                file =>
                    `${file.name}-${file.size}-${file.lastModified}` !== fileToRemoveKey
            )
        );
    };

    const handleUpload = async () => {
        if (!org || selectedFiles.length === 0) {
            return;
        }

        setUploadError('');
        setUploadProgress('');
        let uploadedDatasetId = '';
        let mergeSessionId: string | null = null;

        try {
            if (singleModeActive) {
                setUploadProgress('Checking file schemas...');

                const preview = await mergePreview({
                    orgId: org.id,
                    name: singleDatasetName.trim() || defaultDatasetName,
                    mode: 'append',
                    createNew: true,
                    mergeKeys: [],
                    files: selectedFiles,
                }).unwrap();
                mergeSessionId = preview.sessionId;
                setUploadProgress('Creating dataset...');

                const result = await mergeCommit({
                    sessionId: mergeSessionId,
                    orgId: org.id,
                }).unwrap();
                mergeSessionId = null;
                uploadedDatasetId = result.datasetId;
            } else {
                for (const [index, file] of selectedFiles.entries()) {
                    setUploadProgress(
                        `Uploading ${index + 1} of ${selectedFiles.length}: ${file.name}`
                    );
                    const result = await uploadDataset({ orgId: org.id, file }).unwrap();
                    uploadedDatasetId = result.id;
                }
            }

            setSelectedFiles([]);
            setSingleDatasetName('');
            setUploadMode('separate');
            setUploadProgress('');
            await onUploadSuccess(uploadedDatasetId);
            onClose();
        } catch (error) {
            if (mergeSessionId) {
                void mergeCancel(mergeSessionId);
            }

            setUploadError(
                getApiErrorMessage(
                    error,
                    singleModeActive
                        ? 'Unable to upload these files.'
                        : 'Unable to upload this dataset.'
                )
            );
            setUploadProgress('');
        }
    };

    const buttonLabel = singleModeActive
        ? 'Create one dataset'
        : selectedFiles.length > 1
          ? 'Upload datasets'
          : 'Upload dataset';

    return (
        <Modal title="Upload dataset" padding="md" onClose={onClose}>
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
                        options={uploadModeOptions}
                        disabled={isLoading}
                        onChange={setUploadMode}
                    />
                    {uploadMode === 'single' && (
                        <>
                            <FormField
                                label="Dataset name"
                                hint={`Default: ${defaultDatasetName}`}
                            >
                                <TextInput
                                    type="text"
                                    placeholder={defaultDatasetName}
                                    value={singleDatasetName}
                                    disabled={isLoading}
                                    onChange={event =>
                                        setSingleDatasetName(event.currentTarget.value)
                                    }
                                />
                            </FormField>
                            <span className={styles['schema-note']}>
                                Same column names and data types required.
                            </span>
                        </>
                    )}
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className={styles['file-list']} aria-label="Selected files">
                    {selectedFiles.map(file => {
                        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

                        return (
                            <span key={fileKey} className={styles['file-chip']}>
                                <span className={styles['file-name']}>{file.name}</span>
                                <IconButton
                                    data-p="none"
                                    aria-label={`Remove ${file.name}`}
                                    disabled={isLoading}
                                    onClick={() => handleRemoveFile(file)}
                                >
                                    <X size={14} />
                                </IconButton>
                            </span>
                        );
                    })}
                </div>
            )}

            {uploadProgress && <StatusMessage>{uploadProgress}</StatusMessage>}

            {uploadError && <StatusMessage tone="error">{uploadError}</StatusMessage>}

            <Button
                disabled={selectedFiles.length === 0 || !org || isLoading}
                isLoading={isLoading}
                onClick={() => void handleUpload()}
            >
                <Upload size={18} />
                {buttonLabel}
            </Button>
        </Modal>
    );
};
