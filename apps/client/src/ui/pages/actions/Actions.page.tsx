import { useActionsController, useActionsPageState } from '@/ui/pages/actions/model';
import { useMemo } from 'react';

import { actionsTestIds } from './const';
import { useActionsWorkspaceRouteSync } from './model';
import { ActionEditor } from './ui/ActionEditor';

import styles from './actions.page.module.css';

export const ActionsPage = () => {
    const selectedActionId = useActionsPageState(state => state.selectedActionId);
    const isCreatingAction = useActionsPageState(state => state.isCreatingAction);

    const { org, actionsQuery } = useActionsController();

    const selectedAction = useMemo(
        () =>
            isCreatingAction || !selectedActionId
                ? undefined
                : actionsQuery.data?.find(action => action.id === selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    useActionsWorkspaceRouteSync();

    if (!selectedAction && !isCreatingAction) {
        let content = (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Выберите или создайте действие.
            </p>
        );

        if (selectedActionId && actionsQuery.isPending) {
            content = <p className={styles['empty']}>Загрузка действия…</p>;
        }

        if (selectedActionId && actionsQuery.error) {
            content = <p className={styles['empty']}>Не удалось загрузить действие.</p>;
        }

        return (
            <section
                className={styles['workspace']}
                data-stack="v"
                data-gap="md"
                data-flex
                data-test-id={actionsTestIds.workspace}
                aria-label="Действие"
            >
                {content}
            </section>
        );
    }

    const editorKey = isCreatingAction ? '__new__' : (selectedAction?.id ?? '__none__');

    return (
        <ActionEditor
            key={`${org?.id}/${editorKey}`}
            selectedAction={selectedAction}
            isCreatingAction={isCreatingAction}
            orgId={org?.id}
            orgRole={org?.role}
        />
    );
};
