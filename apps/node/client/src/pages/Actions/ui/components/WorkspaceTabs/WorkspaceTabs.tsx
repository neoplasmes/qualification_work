import { SegmentedTabs } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionsWorkspaceTab } from '../../../model';

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
    <SegmentedTabs
        value={activeTab}
        options={[
            {
                value: 'configure',
                label: 'Configure',
                testId: actionsTestIds.configureTab,
            },
            {
                value: 'run',
                label: 'Run',
                testId: actionsTestIds.runTab,
                disabled: runDisabled,
            },
        ]}
        onChange={onChange}
    />
);
