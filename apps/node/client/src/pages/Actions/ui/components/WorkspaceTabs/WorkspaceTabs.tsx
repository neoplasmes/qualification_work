import { actionsTestIds } from '../../../const';
import type { ActionsWorkspaceTab } from '../../../model';

import styles from '../../ActionsPage.module.scss';

type WorkspaceTabsProps = {
    activeTab: ActionsWorkspaceTab;
    runDisabled: boolean;
    onChange: (tab: ActionsWorkspaceTab) => void;
};

export const WorkspaceTabs = ({
    activeTab,
    runDisabled,
    onChange,
}: WorkspaceTabsProps) => (
    <div className={styles['tabs']}>
        <button
            type="button"
            data-test-id={actionsTestIds.configureTab}
            className={`${styles['tab']} ${activeTab === 'configure' ? styles['active'] : ''}`}
            onClick={() => onChange('configure')}
        >
            Configure
        </button>
        <button
            type="button"
            data-test-id={actionsTestIds.runTab}
            className={`${styles['tab']} ${activeTab === 'run' ? styles['active'] : ''}`}
            disabled={runDisabled}
            onClick={() => onChange('run')}
        >
            Run
        </button>
    </div>
);
