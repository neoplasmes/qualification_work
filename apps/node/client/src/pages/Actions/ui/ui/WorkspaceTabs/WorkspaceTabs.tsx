import { Eye, PencilLine } from 'lucide-react';

import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';

import { actionsTestIds } from '../../../const';
import type { ActionsWorkspaceMode } from '../../../model';

const actionsWorkspaceModeTabs = [
    {
        value: 'view',
        label: 'View',
        icon: Eye,
        testId: actionsTestIds.workspaceViewTab,
    },
    {
        value: 'edit',
        label: 'Edit',
        icon: PencilLine,
        testId: actionsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<ActionsWorkspaceMode>[];

const actionsWorkspaceModeTabsWithDisabledRun = [
    {
        value: 'view',
        label: 'View',
        icon: Eye,
        testId: actionsTestIds.workspaceViewTab,
        disabled: true,
    },
    {
        value: 'edit',
        label: 'Edit',
        icon: PencilLine,
        testId: actionsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<ActionsWorkspaceMode>[];

type WorkspaceTabsProps = {
    activeTab: ActionsWorkspaceMode;
    runDisabled: boolean;
    onChange: (tab: ActionsWorkspaceMode) => void;
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
                ? actionsWorkspaceModeTabsWithDisabledRun
                : actionsWorkspaceModeTabs
        }
        layoutId="actions-workspace-mode"
        onChange={onChange}
    />
);
