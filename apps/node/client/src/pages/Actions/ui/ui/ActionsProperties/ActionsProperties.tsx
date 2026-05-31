import { skipToken } from '@reduxjs/toolkit/query';
import { Archive } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { usePatchActionMutation } from '@/features/manageActions';

import { getEffectLabel, useArchiveActionMutation, type Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { Badge, Button, Card, PanelPlaceholder, StatusMessage, Table } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import { canMutate } from '../../../lib';
import { selectAction } from '../../../model';

import styles from '../../ActionsPage.module.scss';

type ActionsPropertiesProps = {
    selectedAction: Action | undefined;
    refetchActions: () => unknown;
};

export const ActionsProperties = ({
    selectedAction,
    refetchActions,
}: ActionsPropertiesProps) => {
    const dispatch = useDispatch();
    const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(
        null
    );
    const [error, setError] = useState('');
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
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
            dispatch(selectAction(null));
            setArchiveConfirmationId(null);
            await refetchActions();
        } catch (archiveError) {
            setError(getApiErrorMessage(archiveError, 'Unable to archive this action.'));
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
        return <PanelPlaceholder>Select an action to view properties.</PanelPlaceholder>;
    }

    return (
        <section data-display="grid" data-gap="md" aria-label="Action properties">
            <WorkspaceTitleEditor
                title={selectedAction.name}
                fallbackTitle="Untitled action"
                editable={canMutate(org?.role)}
                saving={patchActionState.isLoading}
                editButtonTestId={actionsTestIds.renameButton}
                inputTestId={actionsTestIds.renameInput}
                onRename={handleRename}
            />

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

            <Card
                className={styles['card']}
                data-display="grid"
                data-gap="md"
                data-p="md"
            >
                <span className={styles['eyebrow']}>Datasets</span>
                <div className={styles['meta']}>
                    {affectedDatasets.map(datasetId => (
                        <Badge key={datasetId}>
                            {datasetsById.get(datasetId) ?? 'Unknown dataset'}
                        </Badge>
                    ))}
                </div>
            </Card>

            <Card
                className={styles['card']}
                data-display="grid"
                data-gap="md"
                data-p="md"
            >
                <span className={styles['eyebrow']}>Effects</span>
                <div data-display="grid" data-gap="sm" className={styles['stack']}>
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
                tone="danger"
                disabled={!canMutate(org?.role) || archiveState.isLoading}
                title={
                    canMutate(org?.role)
                        ? undefined
                        : 'Only owners and editors can archive actions.'
                }
                onClick={() => void handleArchive()}
            >
                <Archive size={18} />
                {archiveConfirmationId === selectedAction.id
                    ? 'Confirm archive'
                    : 'Archive action'}
            </Button>
        </section>
    );
};
