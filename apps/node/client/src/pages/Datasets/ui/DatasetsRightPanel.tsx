import { useState } from 'react';

import { DatasetsFilterPanel } from './DatasetsFilterPanel';
import { DatasetsPropertiesPanel } from './DatasetsPropertiesPanel';

import styles from './DatasetsPage.module.scss';

type RightPanelTab = 'properties' | 'filters';

export const DatasetsRightPanel = () => {
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    return (
        <div className={styles['right-panel']}>
            <div className={styles['filter-tabs']}>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'properties' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('properties')}
                >
                    Properties
                </button>
                <button
                    type="button"
                    className={`${styles['filter-tab']} ${activeTab === 'filters' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('filters')}
                >
                    Filters
                </button>
            </div>

            {activeTab === 'properties' ? <DatasetsPropertiesPanel /> : <DatasetsFilterPanel />}
        </div>
    );
};
