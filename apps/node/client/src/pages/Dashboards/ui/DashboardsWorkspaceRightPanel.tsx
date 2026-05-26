import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { dashboardsTestIds } from '../const';
import {
    selectDashboardsRightPanelTab,
    setDashboardsRightPanelTab,
    type DashboardsRightPanelTab,
} from '../model';
import { DashboardsFilterPanel } from './components/DashboardsFilterPanel';
import { DashboardsPropertiesPanel } from './components/DashboardsPropertiesPanel';

const DASHBOARDS_WORKSPACE_RIGHT_PANEL_TABS = [
    'properties',
    'filters',
] as const satisfies readonly DashboardsRightPanelTab[];

const DASHBOARDS_WORKSPACE_RIGHT_PANEL_TAB_TEST_IDS = {
    properties: dashboardsTestIds.propertiesTab,
    filters: dashboardsTestIds.filterTab,
} satisfies Partial<Record<DashboardsRightPanelTab, string>>;

export const DashboardsWorkspaceRightPanel = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectDashboardsRightPanelTab);

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={DASHBOARDS_WORKSPACE_RIGHT_PANEL_TABS}
            testId={dashboardsTestIds.rightPanel}
            tabTestIds={DASHBOARDS_WORKSPACE_RIGHT_PANEL_TAB_TEST_IDS}
            onTabChange={tab => dispatch(setDashboardsRightPanelTab(tab))}
        >
            {activeTab === 'properties' ? (
                <DashboardsPropertiesPanel />
            ) : (
                <DashboardsFilterPanel />
            )}
        </WorkspaceRightPanel>
    );
};
