import { FilterPanel } from '@/ui/widgets/FilterPanel';
import { WorkspaceRightPanel } from '@/ui/widgets/WorkspaceRightPanel';
import { useState } from 'react';

import { datasetsTestIds } from '../../const';
import { DatasetsPropertiesPanel } from '../DatasetsPropertiesPanel';

type RightPanelTab = 'properties' | 'filters';

const datasetsRightPanelTabs = [
    'properties',
    'filters',
] as const satisfies readonly RightPanelTab[];

const datasetsRightPanelTabTestIds = {
    properties: datasetsTestIds.propertiesTab,
    filters: datasetsTestIds.filtersTab,
} satisfies Partial<Record<RightPanelTab, string>>;

export const DatasetsRightPanel = () => {
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    return (
        <WorkspaceRightPanel
            activeTab={activeTab}
            activeTabs={datasetsRightPanelTabs}
            testId={datasetsTestIds.rightPanel}
            tabTestIds={datasetsRightPanelTabTestIds}
            onTabChange={setActiveTab}
        >
            {activeTab === 'properties' ? (
                <DatasetsPropertiesPanel />
            ) : (
                <FilterPanel
                    scope="datasets"
                    testIds={{
                        chip: datasetsTestIds.filterChip,
                        clearButton: datasetsTestIds.clearFilterButton,
                        tabs: {
                            charts: datasetsTestIds.filterTabCharts,
                            dashboards: datasetsTestIds.filterTabDashboards,
                        },
                    }}
                />
            )}
        </WorkspaceRightPanel>
    );
};
