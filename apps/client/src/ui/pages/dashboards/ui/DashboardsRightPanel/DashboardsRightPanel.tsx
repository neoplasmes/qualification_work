import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { FilterPanel } from '@/ui/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/ui/widgets/WorkspaceRightPanel';

import { dashboardsTestIds } from '../../const';
import { type DashboardsRightPanelTab } from '../../model';
import { DashboardsPropertiesPanel } from '../DashboardsPropertiesPanel';

const dashboardsRightPanelTabs = [
    'properties',
    'filters',
] as const satisfies readonly DashboardsRightPanelTab[];

const dashboardsRightPanelTabTestIds = {
    properties: dashboardsTestIds.propertiesTab,
    filters: dashboardsTestIds.filterTab,
} satisfies Partial<Record<DashboardsRightPanelTab, string>>;

export const DashboardsRightPanel = () => {
    const { setDashboardsRightPanelTab } = useDashboardsPageActions();
    const activeTab = useDashboardsPageState(state => state.dashboardsRightPanelTab);

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={dashboardsRightPanelTabs}
            testId={dashboardsTestIds.rightPanel}
            tabTestIds={dashboardsRightPanelTabTestIds}
            onTabChange={tab => setDashboardsRightPanelTab(tab)}
        >
            {activeTab === 'properties' ? (
                <DashboardsPropertiesPanel />
            ) : (
                <FilterPanel
                    scope="dashboards"
                    testIds={{
                        panel: dashboardsTestIds.filterPanel,
                        chip: dashboardsTestIds.filterChip,
                        clearButton: dashboardsTestIds.clearFilterButton,
                        tabs: {
                            charts: dashboardsTestIds.filterTabCharts,
                            datasets: dashboardsTestIds.filterTabDatasets,
                        },
                    }}
                />
            )}
        </WorkspaceRightPanel>
    );
};
