import { useDispatch } from 'react-redux';

import { FilterPanel } from '@/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { useAppSelector } from '@/shared/model';

import { chartsTestIds } from '../../const';
import { setChartsRightPanelTab, type ChartsRightPanelTab } from '../../model';
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
    const dispatch = useDispatch();
    const activeTab = useAppSelector(state => state.chartsPage.chartsRightPanelTab);

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={chartsRightPanelTabs}
            testId={chartsTestIds.rightPanel}
            tabTestIds={chartsRightPanelTabTestIds}
            onTabChange={tab => dispatch(setChartsRightPanelTab(tab))}
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
