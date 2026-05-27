import { useState } from 'react';

import { WorkspaceRightPanel } from '@/widgets/WorkspaceRightPanel';

import { datasetsTestIds } from '../../../const';

import { DatasetsFilterPanel } from '../DatasetsFilterPanel';
import { DatasetsPropertiesPanel } from '../DatasetsPropertiesPanel';

type RightPanelTab = 'properties' | 'filters';

const DATASETS_RIGHT_PANEL_TABS = [
    'properties',
    'filters',
] as const satisfies readonly RightPanelTab[];

const DATASETS_RIGHT_PANEL_TAB_TEST_IDS = {
    properties: datasetsTestIds.propertiesTab,
    filters: datasetsTestIds.filtersTab,
} satisfies Partial<Record<RightPanelTab, string>>;

export const DatasetsRightPanel = () => {
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={DATASETS_RIGHT_PANEL_TABS}
            testId={datasetsTestIds.rightPanel}
            tabTestIds={DATASETS_RIGHT_PANEL_TAB_TEST_IDS}
            onTabChange={setActiveTab}
        >
            {activeTab === 'properties' ? (
                <DatasetsPropertiesPanel />
            ) : (
                <DatasetsFilterPanel />
            )}
        </WorkspaceRightPanel>
    );
};
