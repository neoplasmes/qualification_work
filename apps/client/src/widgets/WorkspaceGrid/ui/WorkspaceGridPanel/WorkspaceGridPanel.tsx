import { useLayoutEffect, useRef } from 'react';

type WorkspaceGridPanelProps = React.PropsWithChildren<{
    className?: string;
}>;

type WorkspaceGridPanelInternalProps = {
    attach: (node: HTMLDivElement) => void;
    external: React.ReactElement<WorkspaceGridPanelProps, typeof WorkspaceGridPanel>;
};

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

export const WorkspaceGridPanelInternal: React.FC<WorkspaceGridPanelInternalProps> = ({
    attach,
    external,
}: WorkspaceGridPanelInternalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (panelRef.current) {
            attach(panelRef.current);
        } else {
            throw new Error('undefined behaviour');
        }
    }, [attach]);

    return (
        <div className={external.props.className} ref={panelRef}>
            {external}
        </div>
    );
};

export type WorkspaceGridPanelInternalElementType = React.ReactElement<
    WorkspaceGridPanelInternalProps,
    typeof WorkspaceGridPanelInternal
>;
