import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { FilterPanel } from '@/ui/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/ui/widgets/WorkspaceRightPanel';

import { chartsTestIds } from '../../const';
import { type ChartsRightPanelTab } from '../../model';
import { ChartsPropertiesPanel } from '../ChartsPropertiesPanel';

const chartsRightPanelTabs = [
    'properties',
    'filters',
] as const satisfies readonly ChartsRightPanelTab[];

const chartsRightPanelTabTestIds = {
    properties: chartsTestIds.propertiesTab,
    filters: chartsTestIds.filterTab,
} satisfies Partial<Record<ChartsRightPanelTab, string>>;

export const ChartsRightPanel = () => {
    const { setChartsRightPanelTab } = useChartsPageActions();
    const activeTab = useChartsPageState(state => state.chartsRightPanelTab);

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={chartsRightPanelTabs}
            testId={chartsTestIds.rightPanel}
            tabTestIds={chartsRightPanelTabTestIds}
            onTabChange={tab => setChartsRightPanelTab(tab)}
        >
            {activeTab === 'properties' ? (
                <ChartsPropertiesPanel />
            ) : (
                <FilterPanel
                    scope="charts"
                    testIds={{
                        panel: chartsTestIds.filterPanel,
                        chip: chartsTestIds.filterChip,
                        clearButton: chartsTestIds.clearFilterButton,
                        tabs: {
                            datasets: chartsTestIds.filterTabDatasets,
                            dashboards: chartsTestIds.filterTabDashboards,
                        },
                    }}
                />
            )}
        </WorkspaceRightPanel>
    );
};
