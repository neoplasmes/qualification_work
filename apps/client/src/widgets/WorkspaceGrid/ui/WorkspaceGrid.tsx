import { useMemo } from 'react';

import { DEFAULT_RESIZER_SIZE, WorkspaceGridContext } from './workspaceGridConfig';
import { WorkspaceGridGroup } from './WorkspaceGridGroup';
import { WorkspaceGridPanel } from './WorkspaceGridPanel';

type WorkspaceGridProps = {
    resizerSize?: number;
    children: React.ReactNode;
};

type WorkspaceGridComponent = ((props: WorkspaceGridProps) => React.ReactNode) & {
    Group: typeof WorkspaceGridGroup;
    Panel: typeof WorkspaceGridPanel;
};

const WorkspaceGridRoot = ({
    resizerSize = DEFAULT_RESIZER_SIZE,
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
