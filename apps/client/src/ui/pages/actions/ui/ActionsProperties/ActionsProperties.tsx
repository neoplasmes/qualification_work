import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActionsPageActions } from '@/ui/pages/actions/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button } from '@qualification-work/design-system';
import { Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { usePatchActionMutation } from '@/features/manageActions';

import { getEffectLabel, useArchiveActionMutation, type Action } from '@/entities/action';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { Badge, Card, EditableText, StatusMessage, Table } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { actionsWorkspaceIndexPath, canMutate } from '../../lib';

import styles from '../../actions.page.module.css';

type ActionsPropertiesProps = {
    selectedAction: Action | undefined;
    refetchActions: () => unknown;
};

export const ActionsProperties = ({
    selectedAction,
    refetchActions,
}: ActionsPropertiesProps) => {
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
    const [patchAction, patchActionState] = usePatchActionMutation();
    const [archiveAction, archiveState] = useArchiveActionMutation();

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
            await archiveAction(selectedAction.id).unwrap();
            selectAction(null);
            navigate(actionsWorkspaceIndexPath, { replace: true });
            setArchiveConfirmationId(null);
            await refetchActions();
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
            await patchAction({ actionId: selectedAction.id, name }).unwrap();
            await refetchActions();
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
                Select an action to view properties.
            </p>
        );
    }

    let titleContent: ReactNode;

    if (canMutate(org?.role)) {
        titleContent = (
            <EditableText
                title={selectedAction.name}
                fallbackTitle="Untitled action"
                saving={patchActionState.isLoading}
                editButtonTestId={actionsTestIds.renameButton}
                inputTestId={actionsTestIds.renameInput}
                onRename={handleRename}
            />
        );
    } else {
        titleContent = (
            <h2 className={styles['title']}>
                {selectedAction.name.trim() || 'Untitled action'}
            </h2>
        );
    }

    let datasetsContent: ReactNode;

    if (affectedDatasets.length === 0) {
        datasetsContent = <span className={styles['empty-meta']}>No datasets</span>;
    } else {
        datasetsContent = affectedDatasets.map(datasetId => {
            const datasetName = datasetsById.get(datasetId) ?? 'Unknown dataset';

            return (
                <Badge
                    key={datasetId}
                    className={styles['dataset-badge']}
                    title={datasetName}
                >
                    {datasetName}
                </Badge>
            );
        });
    }

    return (
        <section data-stack="v" data-gap="md" aria-label="Action properties">
            {titleContent}

            {error && <StatusMessage tone="error">{error}</StatusMessage>}

            <Table
                aria-label="Action properties"
                headers={{ key: 'Property', value: 'Value' }}
                rows={[
                    { key: 'Effects', value: selectedAction.effects.length },
                    { key: 'Params', value: selectedAction.parameters.length },
                    { key: 'Created', value: formatDate(selectedAction.createdAt) },
                    { key: 'Updated', value: formatDate(selectedAction.updatedAt) },
                ]}
            />

            <Card className={styles['card']} data-stack="v" data-gap="sm" data-p="md">
                <span className={styles['eyebrow']}>Datasets</span>
                <div className={styles['datasets-list']}>{datasetsContent}</div>
            </Card>

            <Card className={styles['card']} data-stack="v" data-gap="md" data-p="md">
                <span className={styles['eyebrow']}>Effects</span>
                <div data-stack="v" data-gap="sm" className={styles['stack']}>
                    {selectedAction.effects.map((effect, index) => (
                        <StatusMessage
                            key={`${effect.kind}-${effect.datasetId}-${index}`}
                        >
                            {index + 1}. {getEffectLabel(effect.kind)}
                        </StatusMessage>
                    ))}
                </div>
            </Card>

            <Button
                variant="danger"
                disabled={!canMutate(org?.role) || archiveState.isLoading}
                title={
                    canMutate(org?.role)
                        ? undefined
                        : 'Only owners and editors can delete actions.'
                }
                onClick={() => void handleArchive()}
            >
                <Trash2 size={18} />
                {archiveConfirmationId === selectedAction.id
                    ? 'Confirm delete'
                    : 'Delete action'}
            </Button>
        </section>
    );
};
