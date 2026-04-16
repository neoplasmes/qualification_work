import { WorkspaceGridGroup } from './WorkspaceGridGroup';
import { WorkspaceGridPanel } from './WorkspaceGridPanel';

type WorkspaceGridProps = {
    children: React.ReactNode;
};

type WorkspaceGridComponent = ((props: WorkspaceGridProps) => React.ReactNode) & {
    Group: typeof WorkspaceGridGroup;
    Panel: typeof WorkspaceGridPanel;
};

export const WorkspaceGrid: WorkspaceGridComponent = Object.assign(
    ({ children }: WorkspaceGridProps) => children,
    {
        Group: WorkspaceGridGroup,
        Panel: WorkspaceGridPanel,
    }
);
