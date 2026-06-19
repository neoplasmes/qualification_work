import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionsQuery } from '@/entities/action';

import { useAppSelector } from '@/shared/model';

import { actionsTestIds } from './const';
import { useActionsWorkspaceRouteSync } from './lib';
import { ActionEditor } from './ui/ActionEditor';

import styles from './ActionsPage.module.scss';

export const ActionsPage = () => {
    const selectedActionId = useAppSelector(state => state.actionsPage.selectedActionId);
    const isCreatingAction = useAppSelector(state => state.actionsPage.isCreatingAction);
    const workspaceMode = useAppSelector(state => state.actionsPage.workspaceMode);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);

    const selectedAction = useMemo(
        () =>
            isCreatingAction || !selectedActionId
                ? undefined
                : actionsQuery.data?.find(action => action.id === selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    useActionsWorkspaceRouteSync(selectedActionId, isCreatingAction, workspaceMode);

    if (!selectedAction && !isCreatingAction) {
        let content = (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Select or create an action.
            </p>
        );

        if (selectedActionId && actionsQuery.isLoading) {
            content = <p className={styles['empty']}>Loading action...</p>;
        }

        if (selectedActionId && actionsQuery.isError) {
            content = <p className={styles['empty']}>Unable to load this action.</p>;
        }

        return (
            <section
                className={styles['workspace']}
                data-stack="v"
                data-gap="md"
                data-flex
                data-test-id={actionsTestIds.workspace}
                aria-label="Action details"
            >
                {content}
            </section>
        );
    }

    const editorKey = isCreatingAction ? '__new__' : (selectedAction?.id ?? '__none__');

    return (
        <ActionEditor
            key={editorKey}
            selectedAction={selectedAction}
            isCreatingAction={isCreatingAction}
            orgId={org?.id}
            orgRole={org?.role}
            refetchActions={actionsQuery.refetch}
        />
    );
};
