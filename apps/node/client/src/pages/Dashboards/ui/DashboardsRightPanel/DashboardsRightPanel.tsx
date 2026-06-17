import { useDispatch } from 'react-redux';

import { FilterPanel } from '@/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { useAppSelector } from '@/shared/model';

import { dashboardsTestIds } from '../../const';
import { setDashboardsRightPanelTab, type DashboardsRightPanelTab } from '../../model';
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
    const dispatch = useDispatch();
    const activeTab = useAppSelector(
        state => state.dashboardsPage.dashboardsRightPanelTab
    );

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={dashboardsRightPanelTabs}
            testId={dashboardsTestIds.rightPanel}
            tabTestIds={dashboardsRightPanelTabTestIds}
            onTabChange={tab => dispatch(setDashboardsRightPanelTab(tab))}
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
