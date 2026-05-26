import {
    WorkspaceModeTabs,
    type WorkspaceModeTabOption,
} from '@/widgets/WorkspaceModeTabs';
import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { dashboardsTestIds } from '../../../const';

type WorkspaceMode = 'view' | 'edit';

const DASHBOARDS_WORKSPACE_MODE_TABS = [
    {
        value: 'view',
        label: 'View',
        testId: dashboardsTestIds.workspaceViewTab,
    },
    {
        value: 'edit',
        label: 'Edit',
        testId: dashboardsTestIds.workspaceEditTab,
    },
] as const satisfies readonly WorkspaceModeTabOption<WorkspaceMode>[];

type DashboardWorkspaceHeadingProps = {
    name: string;
    widgetsCount: number;
    editing: boolean;
    renaming: boolean;
    onRename: (name: string) => Promise<void> | void;
    onEditingChange: (editing: boolean) => void;
};

export const DashboardWorkspaceHeading = ({
    name,
    widgetsCount,
    editing,
    renaming,
    onRename,
    onEditingChange,
}: DashboardWorkspaceHeadingProps) => (
    <div data-stack="v" data-gap="sm">
        <WorkspaceTitleEditor
            eyebrow="Dashboard"
            title={name}
            fallbackTitle="Untitled dashboard"
            meta={`${widgetsCount} widgets`}
            saving={renaming}
            editButtonTestId={dashboardsTestIds.renameButton}
            inputTestId={dashboardsTestIds.renameInput}
            onRename={onRename}
        />

        <WorkspaceModeTabs
            value={editing ? 'edit' : 'view'}
            options={DASHBOARDS_WORKSPACE_MODE_TABS}
            layoutId="dashboards-workspace-mode"
            onChange={mode => onEditingChange(mode === 'edit')}
        />
    </div>
);
