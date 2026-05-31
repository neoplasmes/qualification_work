import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import {
    filterApplicationEntities,
    selectFilterApplicationValues,
} from '@/features/filterApplicationEntities';

import { useListActionsQuery } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { actionsTestIds } from '../const';
import { canMutate } from '../lib';
import {
    selectAction,
    selectIsCreatingAction,
    selectSelectedActionId,
    startCreateAction,
} from '../model/actionsPageSlice';

export const ActionsLeftPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);

    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);
    const filterValues = useSelector(selectFilterApplicationValues('actions'));

    const filteredActions = useMemo(
        () =>
            filterApplicationEntities({
                scope: 'actions',
                actions: actionsQuery.data,
                values: filterValues,
            }) ?? [],
        [actionsQuery.data, filterValues]
    );

    const canCreate = canMutate(org?.role);

    return (
        <WorkspaceLeftPanel
            title="Actions"
            countLabel={`Total: ${filteredActions.length} actions`}
            testId={actionsTestIds.listPanel}
            listLabel="Actions"
            loading={actionsQuery.isLoading}
            loadingText="Loading actions..."
            empty={filteredActions.length === 0 && !isCreatingAction}
            emptyText="Create an action to automate a small workflow."
            action={{
                label: 'New action',
                Icon: Plus,
                disabled: !canCreate,
                title: canCreate
                    ? undefined
                    : 'Only owners and editors can create actions.',
                onClick: () => dispatch(startCreateAction()),
            }}
        >
            {isCreatingAction ? (
                <WorkspaceLeftPanelItem
                    selected
                    header="New action"
                    details={['Draft', 'Not saved']}
                    onClick={() => dispatch(startCreateAction())}
                />
            ) : null}
            {filteredActions.map(action => (
                <WorkspaceLeftPanelItem
                    key={action.id}
                    selected={selectedActionId === action.id && !isCreatingAction}
                    header={action.name}
                    details={[
                        `${action.parameters.length} params`,
                        `${action.effects.length} effects`,
                        formatDate(action.updatedAt),
                    ]}
                    iconElement={<Workflow size={18} />}
                    onClick={() => dispatch(selectAction(action.id))}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
