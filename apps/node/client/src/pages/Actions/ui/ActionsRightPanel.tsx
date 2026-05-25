import { skipToken } from '@reduxjs/toolkit/query';
import { Archive, ListFilter, ScrollText, Settings2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    useArchiveActionMutation,
    useListActionRunsQuery,
    useListActionsQuery,
    type Action,
    type ActionRun,
} from '@/features/actions';
import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListDatasetsQuery } from '@/features/datasets';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

import {
    clearActionsDatasetFilters,
    clearActionsEffectFilters,
    clearActionsRunStatusFilters,
    clearAllActionsFilters,
    selectAction,
    selectActionsFilterDatasetIds,
    selectActionsFilterEffectKinds,
    selectActionsFilterRunStatuses,
    selectActionsFiltersTab,
    selectActionsRightPanelTab,
    selectActionsSearchText,
    selectIsCreatingAction,
    selectSelectedActionId,
    setActionsFiltersTab,
    setActionsRightPanelTab,
    setActionsSearchText,
    toggleActionsDatasetFilter,
    toggleActionsEffectFilter,
    toggleActionsRunStatusFilter,
} from '../model/actionsPageSlice';

import styles from './ActionsPage.module.scss';

const canMutate = (role: string | undefined) => role === 'owner' || role === 'editor';

const getSelectedAction = (
    actions: Action[] | undefined,
    selectedActionId: string | null
) => {
    if (!actions || actions.length === 0) {
        return undefined;
    }

    return actions.find(action => action.id === selectedActionId) ?? actions[0];
};

const getEffectLabel = (kind: Action['effects'][number]['kind']) =>
    kind === 'insertRow' ? 'Insert row' : 'Update by match';

const summarizeRun = (run: ActionRun) => {
    if (run.status === 'failed') {
        return run.errorMessage ?? 'Run failed.';
    }

    if (run.changes.length === 0) {
        return 'No changes recorded.';
    }

    return `${run.changes.length} changes`;
};

export const ActionsRightPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const activeTab = useSelector(selectActionsRightPanelTab);
    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);

    const selectedAction = useMemo(
        () => (isCreatingAction ? undefined : getSelectedAction(actionsQuery.data, selectedActionId)),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    return (
        <aside className={styles['right-panel']}>
            <div className={`${styles['tabs']} ${styles['tabs-three']}`}>
                <button
                    type="button"
                    className={`${styles['tab']} ${activeTab === 'history' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsRightPanelTab('history'))}
                >
                    <ScrollText size={15} />
                    History
                </button>
                <button
                    type="button"
                    className={`${styles['tab']} ${activeTab === 'properties' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsRightPanelTab('properties'))}
                >
                    <Settings2 size={15} />
                    Properties
                </button>
                <button
                    type="button"
                    className={`${styles['tab']} ${activeTab === 'filters' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsRightPanelTab('filters'))}
                >
                    <ListFilter size={15} />
                    Filters
                </button>
            </div>

            {activeTab === 'history' && <ActionsHistory selectedAction={selectedAction} />}
            {activeTab === 'properties' && <ActionsProperties selectedAction={selectedAction} />}
            {activeTab === 'filters' && <ActionsFilters />}
        </aside>
    );
};

type ActionsHistoryProps = {
    selectedAction: Action | undefined;
};

const ActionsHistory = ({ selectedAction }: ActionsHistoryProps) => {
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const runsQuery = useListActionRunsQuery(
        org
            ? selectedAction
                ? { kind: 'action', orgId: org.id, actionId: selectedAction.id, limit: 50 }
                : { kind: 'org', orgId: org.id, limit: 50 }
            : skipToken
    );
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const actionNames = useMemo(
        () => new Map((actionsQuery.data ?? []).map(action => [action.id, action.name])),
        [actionsQuery.data]
    );

    return (
        <section className={styles['right-section']} aria-label="Action history">
            <div className={styles['header-row']}>
                <span className={styles['eyebrow']}>
                    {selectedAction ? 'Action runs' : 'Recent runs'}
                </span>
                <IconButton
                    aria-label="Refresh history"
                    disabled={runsQuery.isFetching}
                    onClick={() => void runsQuery.refetch()}
                >
                    <ScrollText size={16} />
                </IconButton>
            </div>

            <div className={styles['history-list']}>
                {runsQuery.isLoading && <div className={styles['status']}>Loading history...</div>}
                {runsQuery.data?.length === 0 && (
                    <div className={styles['empty']}>No runs yet.</div>
                )}
                {runsQuery.data?.map(run => (
                    <article key={run.id} className={styles['run-card']}>
                        <div className={styles['card-header']}>
                            <div>
                                <div className={styles['action-name']}>
                                    {actionNames.get(run.actionId) ?? 'Archived action'}
                                </div>
                                <div className={styles['meta']}>
                                    <span>{formatDate(run.executedAt)}</span>
                                    <span>{summarizeRun(run)}</span>
                                </div>
                            </div>
                            <span
                                className={`${styles['badge']} ${
                                    run.status === 'success'
                                        ? styles['badge-success']
                                        : styles['badge-failed']
                                }`}
                            >
                                {run.status}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

type ActionsPropertiesProps = {
    selectedAction: Action | undefined;
};

const ActionsProperties = ({ selectedAction }: ActionsPropertiesProps) => {
    const dispatch = useDispatch();
    const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [archiveAction, archiveState] = useArchiveActionMutation();

    const datasetsById = useMemo(
        () => new Map((datasetsQuery.data ?? []).map(item => [item.dataset.id, item.dataset.name])),
        [datasetsQuery.data]
    );
    const affectedDatasets = selectedAction
        ? Array.from(new Set(selectedAction.effects.map(effect => effect.datasetId)))
        : [];

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
            await actionsQuery.refetch();
        } catch (archiveError) {
            setError(getApiErrorMessage(archiveError, 'Unable to archive this action.'));
        }
    };

    if (!selectedAction) {
        return <p className={styles['placeholder']}>Select an action to view properties.</p>;
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
                <div className={styles['property-row']}>
                    <span>Effects</span>
                    <span>{selectedAction.effects.length}</span>
                </div>
                <div className={styles['property-row']}>
                    <span>Params</span>
                    <span>{selectedAction.parameters.length}</span>
                </div>
                <div className={styles['property-row']}>
                    <span>Created</span>
                    <span>{formatDate(selectedAction.createdAt)}</span>
                </div>
                <div className={styles['property-row']}>
                    <span>Updated</span>
                    <span>{formatDate(selectedAction.updatedAt)}</span>
                </div>
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
                        <div key={`${effect.kind}-${effect.datasetId}-${index}`} className={styles['status']}>
                            {index + 1}. {getEffectLabel(effect.kind)}
                        </div>
                    ))}
                </div>
            </div>

            <Button
                variant="danger"
                disabled={!canMutate(org?.role) || archiveState.isLoading}
                title={canMutate(org?.role) ? undefined : 'Only owners and editors can archive actions.'}
                onClick={() => void handleArchive()}
            >
                <Archive size={18} />
                {archiveConfirmationId === selectedAction.id ? 'Confirm archive' : 'Archive action'}
            </Button>
        </section>
    );
};

const ActionsFilters = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const filtersTab = useSelector(selectActionsFiltersTab);
    const searchText = useSelector(selectActionsSearchText);
    const datasetIds = useSelector(selectActionsFilterDatasetIds);
    const effectKinds = useSelector(selectActionsFilterEffectKinds);
    const runStatuses = useSelector(selectActionsFilterRunStatuses);

    const hasActiveFilter =
        searchText.trim() ||
        datasetIds.length > 0 ||
        effectKinds.length > 0 ||
        runStatuses.length > 0;

    return (
        <section className={styles['right-section']} aria-label="Action filters">
            <div className={styles['header-row']}>
                <span className={styles['eyebrow']}>Filter by</span>
                <IconButton
                    aria-label="Clear filters"
                    style={{ visibility: hasActiveFilter ? 'visible' : 'hidden' }}
                    onClick={() => dispatch(clearAllActionsFilters())}
                >
                    <X size={16} />
                </IconButton>
            </div>

            <label className={styles['control']}>
                <span>Search</span>
                <input
                    value={searchText}
                    placeholder="Action name"
                    onChange={event => dispatch(setActionsSearchText(event.target.value))}
                />
            </label>

            <div className={`${styles['tabs']} ${styles['tabs-three']}`}>
                <button
                    type="button"
                    className={`${styles['tab']} ${filtersTab === 'datasets' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsFiltersTab('datasets'))}
                >
                    Datasets
                    {datasetIds.length > 0 && (
                        <span className={styles['tab-count']}>{datasetIds.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles['tab']} ${filtersTab === 'effects' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsFiltersTab('effects'))}
                >
                    Effects
                    {effectKinds.length > 0 && (
                        <span className={styles['tab-count']}>{effectKinds.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles['tab']} ${filtersTab === 'runs' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsFiltersTab('runs'))}
                >
                    Runs
                    {runStatuses.length > 0 && (
                        <span className={styles['tab-count']}>{runStatuses.length}</span>
                    )}
                </button>
            </div>

            {filtersTab === 'datasets' && (
                <div className={styles['filter-list']}>
                    <Button disabled={datasetIds.length === 0} onClick={() => dispatch(clearActionsDatasetFilters())}>
                        Clear datasets
                    </Button>
                    {datasetsQuery.data?.map(item => (
                        <button
                            type="button"
                            key={item.dataset.id}
                            className={`${styles['filter-chip']} ${
                                datasetIds.includes(item.dataset.id) ? styles['selected'] : ''
                            }`}
                            onClick={() => dispatch(toggleActionsDatasetFilter(item.dataset.id))}
                        >
                            <div className={styles['filter-chip-name']}>{item.dataset.name}</div>
                            <div className={styles['filter-chip-meta']}>
                                <span>{item.totalRows} rows</span>
                                <span>{formatDate(item.dataset.updatedAt)}</span>
                            </div>
                        </button>
                    ))}
                    {datasetsQuery.data?.length === 0 && (
                        <div className={styles['empty']}>No datasets yet.</div>
                    )}
                </div>
            )}

            {filtersTab === 'effects' && (
                <div className={styles['filter-list']}>
                    <Button disabled={effectKinds.length === 0} onClick={() => dispatch(clearActionsEffectFilters())}>
                        Clear effects
                    </Button>
                    {(['insertRow', 'updateRowsByMatch'] as const).map(kind => (
                        <button
                            type="button"
                            key={kind}
                            className={`${styles['filter-chip']} ${
                                effectKinds.includes(kind) ? styles['selected'] : ''
                            }`}
                            onClick={() => dispatch(toggleActionsEffectFilter(kind))}
                        >
                            <div className={styles['filter-chip-name']}>{getEffectLabel(kind)}</div>
                            <div className={styles['filter-chip-meta']}>
                                <span>{kind}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {filtersTab === 'runs' && (
                <div className={styles['filter-list']}>
                    <Button disabled={runStatuses.length === 0} onClick={() => dispatch(clearActionsRunStatusFilters())}>
                        Clear runs
                    </Button>
                    {(['success', 'failed'] as const).map(status => (
                        <button
                            type="button"
                            key={status}
                            className={`${styles['filter-chip']} ${
                                runStatuses.includes(status) ? styles['selected'] : ''
                            }`}
                            onClick={() => dispatch(toggleActionsRunStatusFilter(status))}
                        >
                            <div className={styles['filter-chip-name']}>{status}</div>
                            <div className={styles['filter-chip-meta']}>
                                <span>Run status</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};
