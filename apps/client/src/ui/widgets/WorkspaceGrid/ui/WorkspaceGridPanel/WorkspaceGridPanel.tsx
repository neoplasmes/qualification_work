import type { WorkspaceGridPanelModel } from '../../model';

export type WorkspaceGridPanelProps = React.PropsWithChildren<{
    className?: string;
    /**
     * stable identifier used by the collapse controller to hide this panel
     */
    panelKey?: string;
    initialSize: WorkspaceGridPanelModel['initialSize'];
    minSize: WorkspaceGridPanelModel['minSize'];
    maxSize: WorkspaceGridPanelModel['maxSize'];
}>;

/**
 * external component for users to use. We can not pass attach function outside of the
 * context of WorkspaceGridGroup so it looks like this and just returns its children.
 *
 * @param param0
 * @returns
 */
export const WorkspaceGridPanel: React.FC<WorkspaceGridPanelProps> = ({
    children,
}: WorkspaceGridPanelProps) => {
    return children;
};

export type WorkspaceGridPanelElementType = React.ReactElement<
    WorkspaceGridPanelProps,
    typeof WorkspaceGridPanel
>;
