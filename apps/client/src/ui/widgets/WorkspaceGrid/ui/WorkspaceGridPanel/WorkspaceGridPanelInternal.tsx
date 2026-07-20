import { useLayoutEffect, useRef } from 'react';

import type { WorkspaceGridPanel, WorkspaceGridPanelProps } from './WorkspaceGridPanel';

import styles from './WorkspaceGridPanel.module.css';

// ------------------------------------------------------------------------------------------------------------------------

type WorkspaceGridPanelInternalProps = {
    attach: (node: HTMLDivElement) => void;
    external: React.ReactElement<WorkspaceGridPanelProps, typeof WorkspaceGridPanel>;
    /**
     * collapsed panels stay mounted (size preserved) but are hidden via display:none
     */
    hidden?: boolean;
};

/**
 * internal representation of workspace grid panel.
 *
 * @returns
 */
export const WorkspaceGridPanelInternal: React.FC<WorkspaceGridPanelInternalProps> = ({
    attach,
    external,
    hidden,
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
            className={`${styles['workspace-grid-panel']} ${external.props.className ?? ''}`}
            data-p="md"
            data-hidden={hidden || undefined}
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
