import {
    useActionsController,
    useActionsPageActions,
    useActionsPageState,
} from '@/ui/pages/actions/model';
import { FilterPanel } from '@/ui/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/ui/widgets/WorkspaceRightPanel';
import { useMemo } from 'react';

import { actionsTestIds } from '../../const';
import { type ActionsRightPanelTab } from '../../model';
import { ActionsHistory } from '../ActionsHistory';
import { ActionsProperties } from '../ActionsProperties';

const actionsRightPanelTabs = [
    'properties',
    'history',
    'filters',
] as const satisfies readonly ActionsRightPanelTab[];

const actionsRightPanelTabTestIds = {
    history: actionsTestIds.historyTab,
    properties: actionsTestIds.propertiesTab,
    filters: actionsTestIds.filtersTab,
} satisfies Partial<Record<ActionsRightPanelTab, string>>;

export const ActionsRightPanel = () => {
    const { setActionsRightPanelTab } = useActionsPageActions();
    const { actionsQuery } = useActionsController();
    const activeTab = useActionsPageState(state => state.rightPanelTab);
    const selectedActionId = useActionsPageState(state => state.selectedActionId);
    const isCreatingAction = useActionsPageState(state => state.isCreatingAction);

    const selectedAction = useMemo(
        () =>
            isCreatingAction || !selectedActionId
                ? undefined
                : actionsQuery.data?.find(action => action.id === selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    const actionNamesById = useMemo(
        () => new Map((actionsQuery.data ?? []).map(action => [action.id, action.name])),
        [actionsQuery.data]
    );

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={actionsRightPanelTabs}
            testId={actionsTestIds.rightPanel}
            tabTestIds={actionsRightPanelTabTestIds}
            onTabChange={tab => setActionsRightPanelTab(tab)}
        >
            {activeTab === 'history' && (
                <ActionsHistory actionNamesById={actionNamesById} />
            )}
            {activeTab === 'properties' && (
                <ActionsProperties selectedAction={selectedAction} />
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
