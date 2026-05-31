import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionsQuery } from '@/entities/action';

import { actionsTestIds } from '../const';
import { getSelectedAction } from '../lib';
import { selectIsCreatingAction, selectSelectedActionId } from '../model';
import { ActionEditor } from './ui/ActionEditor';

import styles from './ActionsPage.module.scss';

export const ActionsWorkspace = () => {
    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);

    const selectedAction = useMemo(
        () =>
            isCreatingAction
                ? undefined
                : getSelectedAction(actionsQuery.data, selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    if (!selectedAction && !isCreatingAction) {
        return (
            <section
                className={styles['workspace']}
                data-stack="v"
                data-gap="md"
                data-flex
                data-test-id={actionsTestIds.workspace}
                aria-label="Action details"
            >
                <p
                    className={styles['placeholder']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-flex
                >
                    Select or create an action.
                </p>
            </section>
        );
    }

    // key drops local state on action switch instead of syncing via effect
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
