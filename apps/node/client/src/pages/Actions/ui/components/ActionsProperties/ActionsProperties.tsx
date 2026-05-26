import { skipToken } from '@reduxjs/toolkit/query';
import { Archive } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useArchiveActionMutation, type Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import {
    Badge,
    Button,
    Card,
    PanelPlaceholder,
    SectionHeader,
    StatusMessage,
} from '@/shared/ui';

import { canMutate, getEffectLabel } from '../../../lib';
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

    if (!selectedAction) {
        return <PanelPlaceholder>Select an action to view properties.</PanelPlaceholder>;
    }

    return (
        <section className={styles['right-section']} aria-label="Action properties">
            <SectionHeader
                eyebrow="Properties"
                title={selectedAction.name}
                headingLevel={3}
            />

            {error && <StatusMessage tone="error">{error}</StatusMessage>}

            <div className={styles['properties-grid']}>
                <PropertyRow label="Effects" value={selectedAction.effects.length} />
                <PropertyRow label="Params" value={selectedAction.parameters.length} />
                <PropertyRow
                    label="Created"
                    value={formatDate(selectedAction.createdAt)}
                />
                <PropertyRow
                    label="Updated"
                    value={formatDate(selectedAction.updatedAt)}
                />
            </div>

            <Card className={styles['card']}>
                <SectionHeader eyebrow="Datasets" />
                <div className={styles['meta']}>
                    {affectedDatasets.map(datasetId => (
                        <Badge key={datasetId}>
                            {datasetsById.get(datasetId) ?? 'Unknown dataset'}
                        </Badge>
                    ))}
                </div>
            </Card>

            <Card className={styles['card']}>
                <SectionHeader eyebrow="Effects" />
                <div className={styles['stack']}>
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

const PropertyRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className={styles['property-row']}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);
