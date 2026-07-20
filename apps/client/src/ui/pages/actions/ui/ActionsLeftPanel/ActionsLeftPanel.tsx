import { filterActions } from '@/core/processes/entityFiltering';
import { useActionsPageActions, useActionsPageState } from '@/ui/pages/actions/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { useListActionsQuery } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { actionsWorkspaceIndexPath, canMutate, getActionWorkspaceUrl } from '../../lib';

export const ActionsLeftPanel = () => {
    const { selectAction, startCreateAction } = useActionsPageActions();
    const navigate = useNavigate();
    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);

    const selectedActionId = useActionsPageState(state => state.selectedActionId);
    const isCreatingAction = useActionsPageState(state => state.isCreatingAction);
    const filterValues = useFilters(state => state.values['actions']);

    const filteredActions = useMemo(
        () =>
            filterActions({
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
                onClick: () => {
                    navigate(actionsWorkspaceIndexPath);
                    startCreateAction();
                },
            }}
        >
            {isCreatingAction ? (
                <WorkspaceLeftPanelItem
                    selected
                    header="New action"
                    details={['Draft', 'Not saved']}
                    onClick={() => {
                        navigate(actionsWorkspaceIndexPath);
                        startCreateAction();
                    }}
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
                    onClick={() => {
                        selectAction(action.id);
                        navigate(getActionWorkspaceUrl(action.id, 'view'));
                    }}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
