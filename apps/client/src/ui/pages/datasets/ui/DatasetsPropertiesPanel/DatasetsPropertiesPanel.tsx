import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useDatasetsPageActions, useDatasetsPageState } from '@/ui/pages/datasets/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import {
    Button,
    Divider,
    HStack,
    IconButton,
    Input,
    Notice,
    Stat,
    Text,
} from '@qualification-work/design-system';
import { GitMerge, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';

import { datasetsTestIds } from '../../const';
import { MergeDatasetModal } from '../MergeDatasetModal';

import styles from './datasetsPropertiesPanel.module.css';

export const DatasetsPropertiesPanel = () => {
    const { selectDataset } = useDatasetsPageActions();
    const [datasetError, setDatasetError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [showMerge, setShowMerge] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState('');

    const selectedDatasetId = useDatasetsPageState(state => state.selectedDatasetId);

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const {
        execute: patchDataset,
        isPending: patchPending,
        syncError: patchSyncError,
    } = useCommand(dependencies.patchDataset);
    const {
        execute: deleteDataset,
        isPending: deletePending,
        syncError: deleteSyncError,
    } = useCommand(dependencies.deleteDataset);

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );

    useEffect(() => {
        setRenaming(false);
        setDatasetError('');
        setDeleteConfirmationId(null);
    }, [selectedDataset?.dataset.id, selectedDataset?.dataset.orgId]);

    const handleDeleteDataset = async () => {
        if (!selectedDataset) {
            return;
        }

        if (deleteConfirmationId !== selectedDataset.dataset.id) {
            setDeleteConfirmationId(selectedDataset.dataset.id);

            return;
        }

        setDatasetError('');

        try {
            await deleteDataset({
                orgId: selectedDataset.dataset.orgId,
                datasetId: selectedDataset.dataset.id,
            });
            selectDataset(null);
            setDeleteConfirmationId(null);
        } catch (error) {
            setDatasetError(getApiErrorMessage(error, 'Unable to delete this dataset.'));
        }
    };

    const handleRenameDataset = async (name: string) => {
        // editor only renders when a dataset is selected; bail loudly if invariant breaks
        if (!selectedDataset) {
            throw new Error('No dataset selected for rename.');
        }

        setDatasetError('');

        try {
            await patchDataset({
                datasetId: selectedDataset.dataset.id,
                name,
                orgId: selectedDataset.dataset.orgId,
            });
        } catch (error) {
            const message = getApiErrorMessage(error, 'Unable to rename this dataset.');
            setDatasetError(message);

            throw new Error(message);
        }
    };

    if (!selectedDataset) {
        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Выберите таблицу, чтобы увидеть её свойства.
            </p>
        );
    }

    return (
        <>
            <section className={styles['details']} data-flex aria-label="Dataset details">
                <div className={styles['details-header']}>
                    {renaming && (
                        <form
                            onSubmit={event => {
                                event.preventDefault();
                                void handleRenameDataset(name)
                                    .then(() => setRenaming(false))
                                    .catch(() => {});
                            }}
                        >
                            <Input
                                aria-label="Название таблицы"
                                data-test-id={datasetsTestIds.renameInput}
                                value={name}
                                autoFocus
                                disabled={patchPending}
                                onChange={event => setName(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Escape') {
                                        setRenaming(false);
                                    }
                                }}
                            />
                            <Button type="submit" disabled={patchPending || !name.trim()}>
                                {patchPending ? 'Сохраняем…' : 'Сохранить название'}
                            </Button>
                        </form>
                    )}
                    {!renaming && (
                        <HStack gap={8} align="start" justify="space-between">
                            <Text as="h2" variant="heading-sm">
                                {selectedDataset.dataset.name}
                            </Text>
                            <IconButton
                                aria-label="Rename"
                                data-test-id={datasetsTestIds.renameButton}
                                variant="ghost"
                                onClick={() => {
                                    setName(selectedDataset.dataset.name);
                                    setRenaming(true);
                                }}
                            >
                                <Pencil size={18} />
                            </IconButton>
                        </HStack>
                    )}
                    <div className={styles['details-actions']}>
                        <Button onClick={() => setShowMerge(true)}>
                            <GitMerge size={18} />
                            Объединить данные
                        </Button>
                    </div>
                </div>

                {datasetError && (
                    <Notice tone="danger" role="alert">
                        {datasetError}
                    </Notice>
                )}

                {Boolean(patchSyncError || deleteSyncError) && (
                    <Notice tone="danger" role="status">
                        Изменения сохранены, но обновить список не удалось.
                    </Notice>
                )}
                <HStack gap={24} wrap>
                    <Stat label="Строк" value={selectedDataset.totalRows} />
                    <Stat label="Полей" value={selectedDataset.columns.length} />
                </HStack>
                <Divider />
                <dl className={styles.facts} aria-label="Свойства таблицы">
                    <dt>Источник</dt>
                    <dd>{selectedDataset.dataset.sourceType}</dd>
                    <dt>Создана</dt>
                    <dd>{formatDate(selectedDataset.dataset.createdAt)}</dd>
                </dl>
                <Text as="h3" variant="label">
                    Поля таблицы
                </Text>
                <ul className={styles.columns} aria-label="Поля таблицы">
                    {selectedDataset.columns.map(column => (
                        <li key={column.id}>
                            <Text variant="body-sm">{column.displayName}</Text>
                            <Text variant="label">
                                {column.dataType} ·{' '}
                                {column.isAnalyzable ? 'В анализе' : 'Исключено'}
                            </Text>
                        </li>
                    ))}
                </ul>

                <div className={styles['delete-actions']}>
                    <Button
                        variant="danger"
                        disabled={deletePending}
                        onClick={() => void handleDeleteDataset()}
                    >
                        <Trash2 size={18} />
                        {deleteConfirmationId === selectedDataset.dataset.id
                            ? 'Подтвердить удаление'
                            : 'Удалить таблицу'}
                    </Button>
                </div>
            </section>

            {showMerge && (
                <MergeDatasetModal
                    key={org?.id ?? 'none'}
                    org={org}
                    selectedDataset={selectedDataset}
                    onSuccess={async datasetId => {
                        selectDataset(datasetId);
                        await dependencies.cache.read(dependencies.listDatasets, {
                            orgId: org!.id,
                        });
                        // merge confirmation invalidates rows and columns through the registered command
                    }}
                    onClose={() => setShowMerge(false)}
                />
            )}
        </>
    );
};
