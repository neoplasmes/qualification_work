import {
    Button,
    Checkbox,
    Choice,
    Field,
    Input,
    Notice,
    Text,
    VStack,
} from '@qualification-work/design-system';
import { GitMerge } from 'lucide-react';
import { useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { Modal } from '@/shared/ui';

import { datasetsTestIds } from '../../const';
import { useUploadWorkflow } from '../../model/uploadWorkflow';
import {
    defaultMergeDatasetDraft,
    mergeDatasetConfig,
    mergeDatasetFilesBind,
    mergeDatasetKeysBind,
    mergeDatasetModeBind,
    type MergeDatasetDraft,
} from './model';
import { MergeFilesSection, MergeKeyChips, MergePreviewStep } from './ui';

import styles from './mergeDatasetModal.module.css';

type MergeDatasetModalProps = {
    org: { id: string; name: string } | undefined;
    selectedDataset: DatasetMetadata;
    onSuccess: (datasetId: string) => Promise<void>;
    onClose: () => void;
};

const importModeTabs = [
    { value: 'append', label: 'Добавить строки' },
    { value: 'merge', label: 'Объединить по ключу' },
] as const;

export const MergeDatasetModal = ({
    org,
    selectedDataset,
    onSuccess,
    onClose,
}: MergeDatasetModalProps) => {
    const [draft, setDraft] = useState<MergeDatasetDraft>({
        ...defaultMergeDatasetDraft,
        files: [],
        selectedMergeKeys: [],
    });
    const workflow = useUploadWorkflow(onSuccess, onClose);
    const previewResult = workflow.previewResult;
    const fallbackDatasetName = `${selectedDataset.dataset.name} копия`;
    const canPreview =
        draft.files.length > 0 &&
        !!org &&
        (draft.mode === 'append' || draft.selectedMergeKeys.length > 0);

    const previewAction = !previewResult ? (
        <Button
            data-px="sm"
            data-py="xs"
            data-test-id={datasetsTestIds.mergePreviewButton}
            disabled={!canPreview || workflow.busy || workflow.blocked}
            aria-busy={workflow.busy}
            onClick={() =>
                org &&
                void workflow.requestPreview({
                    orgId: org.id,
                    datasetId: selectedDataset.dataset.id,
                    name: draft.createNew
                        ? draft.newDatasetName.trim() || fallbackDatasetName
                        : undefined,
                    mode: draft.mode,
                    createNew: draft.createNew,
                    mergeKeys: draft.mode === 'merge' ? draft.selectedMergeKeys : [],
                    files: draft.files,
                })
            }
        >
            <GitMerge size={18} />
            Проверить данные
        </Button>
    ) : null;

    return (
        <Modal
            title="Объединение таблицы"
            size="md"
            padding="md"
            onClose={workflow.close}
        >
            {!previewResult && (
                <mergeDatasetConfig.Root
                    className={styles['content']}
                    value={draft}
                    onChange={setDraft}
                >
                    <mergeDatasetConfig.InputPropRenderer bind={mergeDatasetModeBind}>
                        {mode => (
                            <Field label="Способ объединения">
                                <Choice
                                    value={mode.value}
                                    options={importModeTabs}
                                    disabled={workflow.busy}
                                    onValueChange={value =>
                                        mode.setValue(value as 'append' | 'merge')
                                    }
                                    fullWidth
                                />
                            </Field>
                        )}
                    </mergeDatasetConfig.InputPropRenderer>

                    <VStack gap={12}>
                        <Text variant="label">Файлы</Text>
                        <mergeDatasetConfig.InputPropRenderer
                            bind={mergeDatasetFilesBind}
                        >
                            {files => (
                                <MergeFilesSection
                                    files={files.value}
                                    disabled={workflow.busy}
                                    onFilesChange={files.setValue}
                                />
                            )}
                        </mergeDatasetConfig.InputPropRenderer>
                    </VStack>

                    {draft.mode === 'merge' && selectedDataset.columns.length > 0 && (
                        <VStack gap={12}>
                            <Text variant="label">Ключи объединения</Text>
                            <mergeDatasetConfig.InputPropRenderer
                                bind={mergeDatasetKeysBind}
                            >
                                {mergeKeys => (
                                    <MergeKeyChips
                                        columns={selectedDataset.columns}
                                        selectedKeys={mergeKeys.value}
                                        disabled={workflow.busy}
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
                        </VStack>
                    )}

                    <Field
                        label="Создать новую таблицу"
                        description="Текущие строки будут скопированы перед добавлением файлов."
                    >
                        <Checkbox
                            checked={draft.createNew}
                            disabled={workflow.busy}
                            onChange={event =>
                                setDraft(current => ({
                                    ...current,
                                    createNew: event.target.checked,
                                }))
                            }
                        />
                    </Field>
                    {draft.createNew && (
                        <Field
                            label="Название таблицы"
                            description={`По умолчанию: ${fallbackDatasetName}`}
                        >
                            <Input
                                data-test-id={datasetsTestIds.mergeDatasetNameInput}
                                value={draft.newDatasetName}
                                disabled={workflow.busy}
                                placeholder={fallbackDatasetName}
                                onChange={event =>
                                    setDraft(current => ({
                                        ...current,
                                        newDatasetName: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    )}
                </mergeDatasetConfig.Root>
            )}

            {previewResult && (
                <MergePreviewStep
                    mode={draft.mode}
                    previewResult={previewResult}
                    error={workflow.error}
                    committing={workflow.busy}
                    blocked={workflow.blocked}
                    backDisabled={workflow.backDisabled}
                    onBack={() => void workflow.back()}
                    onConfirm={() => void workflow.confirm()}
                />
            )}
            {previewAction}
            {!previewResult && workflow.error && (
                <Notice tone="danger" role="alert">
                    {workflow.error}
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
        </Modal>
    );
};
