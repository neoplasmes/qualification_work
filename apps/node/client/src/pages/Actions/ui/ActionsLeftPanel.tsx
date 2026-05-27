import { skipToken } from '@reduxjs/toolkit/query';
import { Plus, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceLeftPanel, WorkspaceLeftPanelItem } from '@/widgets/WorkspaceLeftPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionRunsQuery, useListActionsQuery } from '@/entities/action';

import { formatDate } from '@/shared/lib/formatDate';

import { actionsTestIds } from '../const';
import { canMutate } from '../lib';
import { filterActions } from '../model/actionDraft';
import {
    selectAction,
    selectActionsFilterDatasetIds,
    selectActionsFilterEffectKinds,
    selectActionsFilterRunStatuses,
    selectActionsSearchText,
    selectIsCreatingAction,
    selectSelectedActionId,
    startCreateAction,
} from '../model/actionsPageSlice';

export const ActionsLeftPanel = () => {
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
                icon: <Plus size={18} />,
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
