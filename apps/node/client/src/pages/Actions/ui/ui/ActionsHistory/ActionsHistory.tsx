import { skipToken } from '@reduxjs/toolkit/query';

import { WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionRunsQuery } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { EmptyState, StatusMessage } from '@/shared/ui';

import { summarizeRun } from '../../../lib';

import styles from '../../ActionsPage.module.scss';

const ignoreHistoryItemClick = () => undefined;

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
            <div data-display="grid" data-gap="sm" className={styles['history-list']}>
                {runsQuery.isLoading && (
                    <StatusMessage centered>Loading history...</StatusMessage>
                )}
                {runsQuery.data?.length === 0 && <EmptyState>No runs yet.</EmptyState>}
                {runsQuery.data?.map(run => {
                    const actionName =
                        actionNamesById.get(run.actionId) ?? 'Archived action';

                    return (
                        <WorkspaceLeftPanelItem
                            key={run.id}
                            header={actionName}
                            details={[formatDate(run.executedAt), summarizeRun(run)]}
                            iconElement={
                                <span
                                    className={`${styles['run-status-dot']} ${styles[`run-status-${run.status}`]}`}
                                    aria-label={`Run ${run.status}`}
                                    title={run.status}
                                />
                            }
                            onClick={ignoreHistoryItemClick}
                        />
                    );
                })}
            </div>
        </section>
    );
};
