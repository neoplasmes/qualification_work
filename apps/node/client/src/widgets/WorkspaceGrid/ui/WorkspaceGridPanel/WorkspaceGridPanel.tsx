import { useLayoutEffect, useRef } from 'react';

import type { WorkspaceGridPanelModel } from '../../model';

import styles from './WorkspaceGridPanel.module.scss';

type WorkspaceGridPanelProps = React.PropsWithChildren<{
    className?: string;
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

// ------------------------------------------------------------------------------------------------------------------------

type WorkspaceGridPanelInternalProps = {
    attach: (node: HTMLDivElement) => void;
    external: React.ReactElement<WorkspaceGridPanelProps, typeof WorkspaceGridPanel>;
};

/**
 * internal representation of workspace grid panel.
 *
 * @returns
 */
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
        <div
            className={`${styles['workspace-grid-panel']} ${external.props.className}`}
            data-p="md"
            ref={panelRef}
        >
            {external}
        </div>
    );
};

export type WorkspaceGridPanelInternalElementType = React.ReactElement<
    WorkspaceGridPanelInternalProps,
    typeof WorkspaceGridPanelInternal
>;
