import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionRunsQuery, type Action } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { Badge, EmptyState, StatusMessage } from '@/shared/ui';

import { summarizeRun } from '../../../lib';

import styles from '../../ActionsPage.module.scss';

type ActionsHistoryProps = {
    selectedAction: Action | undefined;
    actionNamesById: Map<string, string>;
};

export const ActionsHistory = ({
    selectedAction,
    actionNamesById,
}: ActionsHistoryProps) => {
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

    return (
        <section data-display="grid" data-gap="md" aria-label="Action history">
            <span className={styles['eyebrow']}>
                {selectedAction ? 'Action runs' : 'Recent runs'}
            </span>

            <div data-display="grid" data-gap="sm" className={styles['history-list']}>
                {runsQuery.isLoading && (
                    <StatusMessage centered>Loading history...</StatusMessage>
                )}
                {runsQuery.data?.length === 0 && <EmptyState>No runs yet.</EmptyState>}
                {runsQuery.data?.map(run => (
                    <article
                        key={run.id}
                        className={styles['run-card']}
                        data-display="grid"
                        data-gap="md"
                        data-p="md"
                    >
                        <div
                            data-stack="h"
                            data-gap="sm"
                            data-align="start"
                            data-justify="between"
                        >
                            <div>
                                <div className={styles['action-name']}>
                                    {actionNamesById.get(run.actionId) ??
                                        'Archived action'}
                                </div>
                                <div className={styles['meta']}>
                                    <span>{formatDate(run.executedAt)}</span>
                                    <span>{summarizeRun(run)}</span>
                                </div>
                            </div>
                            <Badge tone={run.status === 'success' ? 'success' : 'danger'}>
                                {run.status}
                            </Badge>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};
