import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, RefreshCcw, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useListActionRunsQuery, useListActionsQuery } from '@/features/actions';
import { useActiveOrganization, useGetMeQuery } from '@/features/auth';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

import { filterActions } from '../model/actionDraft';
import {
    selectActionsFilterDatasetIds,
    selectActionsFilterEffectKinds,
    selectActionsFilterRunStatuses,
    selectActionsSearchText,
    selectIsCreatingAction,
    selectAction,
    selectSelectedActionId,
    startCreateAction,
} from '../model/actionsPageSlice';

import styles from './ActionsPage.module.scss';

const canMutate = (role: string | undefined) => role === 'owner' || role === 'editor';

export const ActionsListPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const runsQuery = useListActionRunsQuery(
        org ? { kind: 'org', orgId: org.id, limit: 100 } : skipToken
    );

    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);
    const searchText = useSelector(selectActionsSearchText);
    const filterDatasetIds = useSelector(selectActionsFilterDatasetIds);
    const filterEffectKinds = useSelector(selectActionsFilterEffectKinds);
    const filterRunStatuses = useSelector(selectActionsFilterRunStatuses);

    const filteredActions = useMemo(
        () =>
            filterActions(actionsQuery.data ?? [], {
                searchText,
                datasetIds: filterDatasetIds,
                effectKinds: filterEffectKinds,
                runStatuses: filterRunStatuses,
                runs: runsQuery.data ?? [],
            }),
        [
            actionsQuery.data,
            filterDatasetIds,
            filterEffectKinds,
            filterRunStatuses,
            runsQuery.data,
            searchText,
        ]
    );

    return (
        <aside className={styles['panel']}>
            <div className={styles['header-row']}>
                <div data-stack="v" data-gap="xs">
                    <h1 className={styles['title']}>Actions</h1>
                    <p className={styles['muted']}>{filteredActions.length} actions</p>
                </div>
                <IconButton
                    aria-label="Refresh actions"
                    disabled={actionsQuery.isFetching}
                    onClick={() => void actionsQuery.refetch()}
                >
                    <RefreshCcw size={18} />
                </IconButton>
            </div>

            <Button
                disabled={!canMutate(org?.role)}
                title={canMutate(org?.role) ? undefined : 'Only owners and editors can create actions.'}
                onClick={() => dispatch(startCreateAction())}
            >
                <Plus size={18} />
                New action
            </Button>

            <section className={styles['action-list']} aria-label="Actions">
                {actionsQuery.isLoading && (
                    <div className={styles['status']}>Loading actions...</div>
                )}
                {isCreatingAction && (
                    <button
                        type="button"
                        className={`${styles['action-item']} ${styles['selected']}`}
                        onClick={() => dispatch(startCreateAction())}
                    >
                        <div className={styles['action-name']}>New action</div>
                        <div className={styles['meta']}>
                            <span>Draft</span>
                            <span>Not saved</span>
                        </div>
                    </button>
                )}
                {!actionsQuery.isLoading && filteredActions.length === 0 && !isCreatingAction && (
                    <div className={styles['empty']}>Create an action to automate a small workflow.</div>
                )}
                {filteredActions.map(action => (
                    <button
                        type="button"
                        key={action.id}
                        className={`${styles['action-item']} ${
                            selectedActionId === action.id && !isCreatingAction
                                ? styles['selected']
                                : ''
                        }`}
                        onClick={() => dispatch(selectAction(action.id))}
                    >
                        <div data-stack="h" data-align="center" data-justify="between">
                            <div className={styles['action-name']}>{action.name}</div>
                            <Workflow size={18} />
                        </div>
                        <div className={styles['meta']}>
                            <span>{action.parameters.length} params</span>
                            <span>{action.effects.length} effects</span>
                            <span>{formatDate(action.updatedAt)}</span>
                        </div>
                    </button>
                ))}
            </section>
        </aside>
    );
};
