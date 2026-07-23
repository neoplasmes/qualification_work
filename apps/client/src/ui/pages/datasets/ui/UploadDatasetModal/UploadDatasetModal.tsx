import {
    Button,
    Choice,
    Field,
    IconButton,
    Input,
    Notice,
    Text,
    VStack,
} from '@qualification-work/design-system';
import { Upload, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '@/shared/ui';

import { useUploadWorkflow } from '../../model/uploadWorkflow';

import styles from './uploadDatasetModal.module.css';

type UploadMode = 'separate' | 'single';

type UploadDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    onUploadSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

const uploadModeOptions = [
    { value: 'separate', label: 'Отдельные таблицы' },
    { value: 'single', label: 'Одна таблица' },
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
    const workflow = useUploadWorkflow(onUploadSuccess, onClose);
    const isLoading = workflow.busy || workflow.blocked;
    const singleModeActive = selectedFiles.length > 1 && uploadMode === 'single';
    const defaultDatasetName =
        selectedFiles[0]?.name.replace(filenameExtensionRe, '') || 'dataset';

    const handleFiles = (files: File[]) => {
        setUploadError('');

        if (files.length === 0) {
            return;
        }

        const acceptedFiles = files.filter(file =>
            datasetFileExtensionRe.test(file.name)
        );
        if (acceptedFiles.length !== files.length) {
            setUploadError('Выберите файлы CSV или XLSX.');
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
                ...acceptedFiles.filter(file => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    if (selectedFileKeys.has(key)) {
                        return false;
                    }
                    selectedFileKeys.add(key);

                    return true;
                }),
            ];
        });
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setUploadError('');
        const fileToRemoveKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
        setSelectedFiles(current =>
            current.filter(
                file =>
                    `${file.name}-${file.size}-${file.lastModified}` !== fileToRemoveKey
            )
        );
    };

    const buttonLabel = singleModeActive
        ? 'Создать одну таблицу'
        : selectedFiles.length > 1
          ? 'Загрузить таблицы'
          : 'Загрузить таблицу';

    return (
        <Modal title="Загрузка таблиц" padding="md" onClose={workflow.close}>
            <VStack gap={20}>
                <label
                    data-stack="v"
                    data-gap="sm"
                    data-align="start"
                    data-p="md"
                    className={styles['dropzone']}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                        event.preventDefault();
                        if (!isLoading) {
                            handleFiles(Array.from(event.dataTransfer.files));
                        }
                    }}
                >
                    <UploadCloud size={28} />
                    <Text variant="lead">Перетащите файлы CSV или XLSX</Text>
                    <Text variant="body-sm" tone="muted">
                        Выберите файлы. Первые строки определяют типы полей.
                    </Text>
                    <input
                        className={styles['file-input']}
                        type="file"
                        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        multiple
                        aria-label="Файлы таблицы"
                        disabled={isLoading}
                        onChange={event => {
                            handleFiles(Array.from(event.currentTarget.files ?? []));
                            event.currentTarget.value = '';
                        }}
                    />
                </label>

                {selectedFiles.length > 1 && (
                    <div className={styles['mode-section']}>
                        <Field label="Как загрузить файлы">
                            <Choice
                                options={uploadModeOptions}
                                value={uploadMode}
                                disabled={isLoading}
                                onValueChange={value =>
                                    setUploadMode(value as UploadMode)
                                }
                                fullWidth
                            />
                        </Field>
                        {uploadMode === 'single' && (
                            <>
                                <Field
                                    label="Название таблицы"
                                    description={`По умолчанию: ${defaultDatasetName}`}
                                >
                                    <Input
                                        type="text"
                                        placeholder={defaultDatasetName}
                                        value={singleDatasetName}
                                        disabled={isLoading}
                                        onChange={event =>
                                            setSingleDatasetName(
                                                event.currentTarget.value
                                            )
                                        }
                                    />
                                </Field>
                                <span className={styles['schema-note']}>
                                    Имена и типы полей должны совпадать.
                                </span>
                            </>
                        )}
                    </div>
                )}

                {selectedFiles.length > 0 && (
                    <div className={styles['file-list']} aria-label="Выбранные файлы">
                        {selectedFiles.map(file => {
                            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

                            return (
                                <span key={fileKey} className={styles['file-chip']}>
                                    <span className={styles['file-name']}>
                                        {file.name}
                                    </span>
                                    <IconButton
                                        data-p="none"
                                        aria-label={`Удалить ${file.name}`}
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

                {workflow.progress && (
                    <Text role="status" variant="body-sm">
                        {workflow.progress}
                    </Text>
                )}
                {(uploadError || workflow.error) && (
                    <Notice tone="danger" role="alert">
                        {uploadError || workflow.error}
                    </Notice>
                )}
                {workflow.syncWarning && (
                    <Notice tone="info" role="status">
                        Данные сохранены, но обновить отображение не удалось.{' '}
                        <Button variant="ghost" onClick={() => void workflow.refresh()}>
                            Обновить данные
                        </Button>
                    </Notice>
                )}

                <Button
                    disabled={selectedFiles.length === 0 || !org || isLoading}
                    aria-busy={workflow.busy}
                    onClick={() =>
                        org &&
                        void workflow.submit({
                            orgId: org.id,
                            files: selectedFiles,
                            single: singleModeActive,
                            name: singleDatasetName.trim() || defaultDatasetName,
                        })
                    }
                >
                    <Upload size={18} />
                    {buttonLabel}
                </Button>
            </VStack>
        </Modal>
    );
};
