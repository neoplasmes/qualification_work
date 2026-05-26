import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';

import { actionsTestIds } from '../../../const';
import type { ActionsWorkspaceTab } from '../../../model';

const ACTIONS_WORKSPACE_MODE_TABS = [
    {
        value: 'run',
        label: 'View',
        testId: actionsTestIds.workspaceViewTab,
    },
    {
        value: 'configure',
        label: 'Edit',
        testId: actionsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<ActionsWorkspaceTab>[];

const ACTIONS_WORKSPACE_MODE_TABS_WITH_DISABLED_RUN = [
    {
        value: 'run',
        label: 'View',
        testId: actionsTestIds.workspaceViewTab,
        disabled: true,
    },
    {
        value: 'configure',
        label: 'Edit',
        testId: actionsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<ActionsWorkspaceTab>[];

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
    <WorkspaceModeTabs
        value={activeTab}
        options={
            runDisabled
                ? ACTIONS_WORKSPACE_MODE_TABS_WITH_DISABLED_RUN
                : ACTIONS_WORKSPACE_MODE_TABS
        }
        layoutId="actions-workspace-mode"
        onChange={onChange}
    />
);
