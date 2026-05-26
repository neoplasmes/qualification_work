import { useState } from 'react';

import { datasetsTestIds } from '../../../const';

import { DatasetsFilterPanel } from '../DatasetsFilterPanel';
import { DatasetsPropertiesPanel } from '../DatasetsPropertiesPanel';

import styles from './DatasetsRightPanel.module.scss';

type RightPanelTab = 'properties' | 'filters';

export const DatasetsRightPanel = () => {
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    return (
        <div className={styles['right-panel']} data-test-id={datasetsTestIds.rightPanel}>
            <div className={styles['filter-tabs']}>
                <button
                    type="button"
                    data-test-id={datasetsTestIds.propertiesTab}
                    className={`${styles['filter-tab']} ${activeTab === 'properties' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('properties')}
                >
                    Properties
                </button>
                <button
                    type="button"
                    data-test-id={datasetsTestIds.filtersTab}
                    className={`${styles['filter-tab']} ${activeTab === 'filters' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('filters')}
                >
                    Filters
                </button>
            </div>

            {activeTab === 'properties' ? (
                <DatasetsPropertiesPanel />
            ) : (
                <DatasetsFilterPanel />
            )}
        </div>
    );
};
