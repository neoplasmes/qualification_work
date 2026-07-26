import type { Action } from '@/core/entities/action';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActionsPageActions } from '@/ui/pages/actions/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button, Sheet, Text } from '@qualification-work/design-system';
import { Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { EditableText, StatusMessage, Table } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { actionsWorkspaceIndexPath, canMutate, getEffectLabel } from '../../lib';
import { useActionsController } from '../../model';

import styles from '../../actions.page.module.css';

type ActionsPropertiesProps = {
    selectedAction: Action | undefined;
};

export const ActionsProperties = ({ selectedAction }: ActionsPropertiesProps) => {
    const { selectAction } = useActionsPageActions();
    const navigate = useNavigate();
    const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(
        null
    );
    const [error, setError] = useState('');
    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const { patchAction, archiveAction } = useActionsController();

    const datasetsById = useMemo(
        () =>
            new Map(
                (datasetsQuery.data ?? []).map(item => [
                    item.dataset.id,
                    item.dataset.name,
                ])
            ),
        [datasetsQuery.data]
    );
    const affectedDatasets = useMemo(
        () =>
            selectedAction
                ? Array.from(
                      new Set(selectedAction.effects.map(effect => effect.datasetId))
                  )
                : [],
        [selectedAction]
    );

    const handleArchive = async () => {
        if (!selectedAction || !canMutate(org?.role)) {
            return;
        }

        if (archiveConfirmationId !== selectedAction.id) {
            setArchiveConfirmationId(selectedAction.id);

            return;
        }

        try {
            setError('');
            const outcome = await archiveAction.executeOutcome({
                orgId: org!.id,
                actionId: selectedAction.id,
            });
            if (outcome.syncError) {
                setError('Действие удалено, но обновить список не удалось.');
            }
            selectAction(null);
            navigate(actionsWorkspaceIndexPath, { replace: true });
            setArchiveConfirmationId(null);
        } catch (archiveError) {
            setError(getApiErrorMessage(archiveError, 'Unable to delete this action.'));
        }
    };

    const handleRename = async (name: string) => {
        if (!selectedAction || !canMutate(org?.role)) {
            return;
        }

        try {
            setError('');
            const outcome = await patchAction.executeOutcome({
                orgId: org!.id,
                actionId: selectedAction.id,
                name,
            });
            if (outcome.syncError) {
                setError('Название сохранено, но обновить данные не удалось.');
            }
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this action.'
            );
            setError(message);

            throw new Error(message);
        }
    };

    if (!selectedAction) {
        return (
            <p
                className={styles['properties-placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Выберите действие для просмотра свойств.
            </p>
        );
    }

    let titleContent: ReactNode;

    if (canMutate(org?.role)) {
        titleContent = (
            <EditableText
                title={selectedAction.name}
                fallbackTitle="Без названия"
                saving={patchAction.isPending}
                editButtonTestId={actionsTestIds.renameButton}
                inputTestId={actionsTestIds.renameInput}
                onRename={handleRename}
            />
        );
    } else {
        titleContent = (
            <h2 className={styles['title']}>
                {selectedAction.name.trim() || 'Без названия'}
            </h2>
        );
    }

    let datasetsContent: ReactNode;

    if (affectedDatasets.length === 0) {
        datasetsContent = <span className={styles['empty-meta']}>Нет таблиц</span>;
    } else {
        datasetsContent = affectedDatasets.map(datasetId => {
            const datasetName = datasetsById.get(datasetId) ?? 'Неизвестная таблица';

            return (
                <Text
                    as="span"
                    variant="data"
                    key={datasetId}
                    className={styles['dataset-badge']}
                    title={datasetName}
                >
                    {datasetName}
                </Text>
            );
        });
    }

    return (
        <section data-stack="v" data-gap="md" aria-label="Свойства действия">
            {titleContent}

            {error && <StatusMessage tone="error">{error}</StatusMessage>}

            <Table
                aria-label="Свойства действия"
                headers={{ key: 'Свойство', value: 'Значение' }}
                rows={[
                    { key: 'Что делать с данными', value: selectedAction.effects.length },
                    { key: 'Параметры', value: selectedAction.parameters.length },
                    { key: 'Создано', value: formatDate(selectedAction.createdAt) },
                    { key: 'Обновлено', value: formatDate(selectedAction.updatedAt) },
                ]}
            />

            <Sheet className={styles['card']} data-stack="v" data-gap="sm" data-p="md">
                <span className={styles['eyebrow']}>Таблицы</span>
                <div className={styles['datasets-list']}>{datasetsContent}</div>
            </Sheet>

            <Sheet className={styles['card']} data-stack="v" data-gap="md" data-p="md">
                <span className={styles['eyebrow']}>Что делать с данными</span>
                <div data-stack="v" data-gap="sm" className={styles['stack']}>
                    {selectedAction.effects.map((effect, index) => (
                        <StatusMessage
                            key={`${effect.kind}-${effect.datasetId}-${index}`}
                        >
                            {index + 1}. {getEffectLabel(effect.kind)}
                        </StatusMessage>
                    ))}
                </div>
            </Sheet>

            <Button
                variant="danger"
                disabled={!canMutate(org?.role) || archiveAction.isPending}
                title={
                    canMutate(org?.role)
                        ? undefined
                        : 'Удалять действия могут владельцы и редакторы.'
                }
                onClick={() => void handleArchive()}
            >
                <Trash2 size={18} />
                {archiveConfirmationId === selectedAction.id
                    ? 'Подтвердить удаление'
                    : 'Удалить действие'}
            </Button>
        </section>
    );
};
