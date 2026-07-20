import { useMemo } from 'react';

import { defaultResizerSize, WorkspaceGridContext } from './ui/workspaceGridConfig';
import { WorkspaceGridGroup } from './ui/WorkspaceGridGroup';
import { WorkspaceGridPanel } from './ui/WorkspaceGridPanel';

type WorkspaceGridProps = {
    resizerSize?: number;
    children: React.ReactNode;
};

type WorkspaceGridComponent = ((props: WorkspaceGridProps) => React.ReactNode) & {
    Group: typeof WorkspaceGridGroup;
    Panel: typeof WorkspaceGridPanel;
};

const WorkspaceGridRoot = ({
    resizerSize = defaultResizerSize,
    children,
}: WorkspaceGridProps) => {
    const config = useMemo(() => ({ resizerSize }), [resizerSize]);

    return (
        <WorkspaceGridContext.Provider value={config}>
            {children}
        </WorkspaceGridContext.Provider>
    );
};

export const WorkspaceGrid: WorkspaceGridComponent = Object.assign(WorkspaceGridRoot, {
    Group: WorkspaceGridGroup,
    Panel: WorkspaceGridPanel,
});
