import { skipToken } from '@reduxjs/toolkit/query';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionRunsQuery } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { EmptyState, StatusMessage } from '@/shared/ui';

import { summarizeRun } from '../../../lib';

import styles from '../../ActionsPage.module.scss';

type ActionsHistoryProps = {
    actionNamesById: Map<string, string>;
};

export const ActionsHistory = ({ actionNamesById }: ActionsHistoryProps) => {
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const runsQuery = useListActionRunsQuery(
        org
            ? {
                  kind: 'org',
                  orgId: org.id,
                  limit: 50,
              }
            : skipToken
    );

    return (
        <section data-display="grid" data-gap="md" aria-label="Action history">
            <span className={styles['eyebrow']}>Action runs</span>

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
                            className={styles['run-card-content']}
                            data-stack="h"
                            data-gap="sm"
                            data-align="start"
                            data-justify="between"
                        >
                            <div className={styles['run-card-main']}>
                                <div className={styles['action-name']}>
                                    {actionNamesById.get(run.actionId) ??
                                        'Archived action'}
                                </div>
                                <div className={styles['meta']}>
                                    <span>{formatDate(run.executedAt)}</span>
                                    <span>{summarizeRun(run)}</span>
                                </div>
                            </div>
                            <span
                                className={`${styles['run-status-dot']} ${styles[`run-status-${run.status}`]}`}
                                aria-label={`Run ${run.status}`}
                                title={run.status}
                            />
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};
