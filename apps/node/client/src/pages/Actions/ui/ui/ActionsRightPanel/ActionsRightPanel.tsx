import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FilterPanel } from '@/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionsQuery } from '@/entities/action';

import { actionsTestIds } from '../../../const';
import { getSelectedAction } from '../../../lib';
import {
    selectActionsRightPanelTab,
    selectIsCreatingAction,
    selectSelectedActionId,
    setActionsRightPanelTab,
    type ActionsRightPanelTab,
} from '../../../model';

import { ActionsHistory } from '../ActionsHistory';
import { ActionsProperties } from '../ActionsProperties';

const ACTIONS_RIGHT_PANEL_TABS = [
    'properties',
    'history',
    'filters',
] as const satisfies readonly ActionsRightPanelTab[];

const ACTIONS_RIGHT_PANEL_TAB_TEST_IDS = {
    history: actionsTestIds.historyTab,
    properties: actionsTestIds.propertiesTab,
    filters: actionsTestIds.filtersTab,
} satisfies Partial<Record<ActionsRightPanelTab, string>>;

export const ActionsRightPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const activeTab = useSelector(selectActionsRightPanelTab);
    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);

    const selectedAction = useMemo(
        () =>
            isCreatingAction
                ? undefined
                : getSelectedAction(actionsQuery.data, selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    const actionNamesById = useMemo(
        () => new Map((actionsQuery.data ?? []).map(action => [action.id, action.name])),
        [actionsQuery.data]
    );

    const refetchActions = actionsQuery.refetch;

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={ACTIONS_RIGHT_PANEL_TABS}
            testId={actionsTestIds.rightPanel}
            tabTestIds={ACTIONS_RIGHT_PANEL_TAB_TEST_IDS}
            onTabChange={tab => dispatch(setActionsRightPanelTab(tab))}
        >
            {activeTab === 'history' && (
                <ActionsHistory actionNamesById={actionNamesById} />
            )}
            {activeTab === 'properties' && (
                <ActionsProperties
                    selectedAction={selectedAction}
                    refetchActions={refetchActions}
                />
            )}
            {activeTab === 'filters' && (
                <FilterPanel
                    scope="actions"
                    testIds={{
                        chip: actionsTestIds.filterChip,
                        clearButton: actionsTestIds.clearFiltersButton,
                        tabs: {
                            datasets: actionsTestIds.filterTabDatasets,
                            effects: actionsTestIds.filterTabEffects,
                        },
                    }}
                />
            )}
        </WorkspaceRightPanel>
    );
};
