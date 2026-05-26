import { skipToken } from '@reduxjs/toolkit/query';
import { ScrollText } from 'lucide-react';
import { useMemo } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import {
    useListActionRunsQuery,
    useListActionsQuery,
    type Action,
} from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { IconButton } from '@/shared/ui';

import { summarizeRun } from '../../../lib';

import styles from '../../ActionsPage.module.scss';

type ActionsHistoryProps = {
    selectedAction: Action | undefined;
};

export const ActionsHistory = ({ selectedAction }: ActionsHistoryProps) => {
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const runsQuery = useListActionRunsQuery(
        org
            ? selectedAction
                ? {
                      kind: 'action',
                      orgId: org.id,
                      actionId: selectedAction.id,
                      limit: 50,
                  }
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
                {runsQuery.isLoading && (
                    <div className={styles['status']}>Loading history...</div>
                )}
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
