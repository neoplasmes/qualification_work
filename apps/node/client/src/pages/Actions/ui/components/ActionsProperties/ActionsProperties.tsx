import { skipToken } from '@reduxjs/toolkit/query';
import { Archive } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useArchiveActionMutation, type Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { Button } from '@/shared/ui';

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
        return (
            <p className={styles['placeholder']}>Select an action to view properties.</p>
        );
    }

    return (
        <section className={styles['right-section']} aria-label="Action properties">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Properties</span>
                <h3 className={styles['section-title']}>{selectedAction.name}</h3>
            </div>

            {error && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {error}
                </div>
            )}

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

            <div className={styles['card']}>
                <span className={styles['eyebrow']}>Datasets</span>
                <div className={styles['meta']}>
                    {affectedDatasets.map(datasetId => (
                        <span key={datasetId} className={styles['badge']}>
                            {datasetsById.get(datasetId) ?? 'Unknown dataset'}
                        </span>
                    ))}
                </div>
            </div>

            <div className={styles['card']}>
                <span className={styles['eyebrow']}>Effects</span>
                <div className={styles['stack']}>
                    {selectedAction.effects.map((effect, index) => (
                        <div
                            key={`${effect.kind}-${effect.datasetId}-${index}`}
                            className={styles['status']}
                        >
                            {index + 1}. {getEffectLabel(effect.kind)}
                        </div>
                    ))}
                </div>
            </div>

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
