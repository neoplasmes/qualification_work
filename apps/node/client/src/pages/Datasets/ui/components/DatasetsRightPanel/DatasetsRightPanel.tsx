import { useState } from 'react';

import { SegmentedTabs } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import { DatasetsFilterPanel } from '../DatasetsFilterPanel';
import { DatasetsPropertiesPanel } from '../DatasetsPropertiesPanel';

import styles from './DatasetsRightPanel.module.scss';

type RightPanelTab = 'properties' | 'filters';

export const DatasetsRightPanel = () => {
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    return (
        <div className={styles['right-panel']} data-test-id={datasetsTestIds.rightPanel}>
            <SegmentedTabs
                value={activeTab}
                options={[
                    {
                        value: 'properties',
                        label: 'Properties',
                        testId: datasetsTestIds.propertiesTab,
                    },
                    {
                        value: 'filters',
                        label: 'Filters',
                        testId: datasetsTestIds.filtersTab,
                    },
                ]}
                onChange={setActiveTab}
            />

            {activeTab === 'properties' ? (
                <DatasetsPropertiesPanel />
            ) : (
                <DatasetsFilterPanel />
            )}
        </div>
    );
};
