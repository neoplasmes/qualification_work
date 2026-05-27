import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { chartsTestIds } from '../const';
import {
    selectChartsRightPanelTab,
    setChartsRightPanelTab,
    type ChartsRightPanelTab,
} from '../model';
import { ChartsFilterPanel } from './ui/ChartsFilterPanel';
import { ChartsPropertiesPanel } from './ui/ChartsPropertiesPanel';

const CHARTS_WORKSPACE_RIGHT_PANEL_TABS = [
    'properties',
    'filters',
] as const satisfies readonly ChartsRightPanelTab[];

const CHARTS_WORKSPACE_RIGHT_PANEL_TAB_TEST_IDS = {
    properties: chartsTestIds.propertiesTab,
    filters: chartsTestIds.filterTab,
} satisfies Partial<Record<ChartsRightPanelTab, string>>;

export const ChartsWorkspaceRightPanel = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectChartsRightPanelTab);

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={CHARTS_WORKSPACE_RIGHT_PANEL_TABS}
            testId={chartsTestIds.rightPanel}
            tabTestIds={CHARTS_WORKSPACE_RIGHT_PANEL_TAB_TEST_IDS}
            onTabChange={tab => dispatch(setChartsRightPanelTab(tab))}
        >
            {activeTab === 'properties' ? (
                <ChartsPropertiesPanel />
            ) : (
                <ChartsFilterPanel />
            )}
        </WorkspaceRightPanel>
    );
};
