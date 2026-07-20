import {
    usePanelLayout,
    usePanelLayoutActions,
    WorkspaceGrid,
    type WorkspaceGridCollapseController,
} from '@/ui/widgets/WorkspaceGrid';
import { useMemo, type ComponentType, type LazyExoticComponent } from 'react';

import { ClientOnlyDeffered } from '@/shared/ui/tools/ClientOnlyDeffered';

import styles from './workspaceLayout.widget.module.css';

const workspaceFallback = <div className={styles['panel-fallback']} />;

type WorkspacePanelKey = 'left' | 'right';

export const WorkspaceLayout = ({
    slots,
}: {
    slots: {
        Left: LazyExoticComponent<ComponentType>;
        Center: LazyExoticComponent<ComponentType>;
        Right: LazyExoticComponent<ComponentType>;
    };
}) => {
    const { toggleLeftPanel, toggleRightPanel } = usePanelLayoutActions();
    const isLeftCollapsed = usePanelLayout(state => state.isLeftCollapsed);
    const isRightCollapsed = usePanelLayout(state => state.isRightCollapsed);

    const collapse = useMemo<WorkspaceGridCollapseController<WorkspacePanelKey>>(() => {
        const collapsed = new Set<WorkspacePanelKey>();
        if (isLeftCollapsed) {
            collapsed.add('left');
        }
        if (isRightCollapsed) {
            collapsed.add('right');
        }

        const toggle = (key: WorkspacePanelKey) =>
            key === 'left' ? toggleLeftPanel() : toggleRightPanel();

        return {
            collapsed,
            isCollapsed: key => collapsed.has(key),
            toggle,
            collapse: key => {
                if (!collapsed.has(key)) {
                    toggle(key);
                }
            },
            expand: key => {
                if (collapsed.has(key)) {
                    toggle(key);
                }
            },
        };
    }, [isLeftCollapsed, isRightCollapsed, toggleLeftPanel, toggleRightPanel]);

    const { Left, Center, Right } = slots;

    return (
        <WorkspaceGrid resizerSize={4}>
            <WorkspaceGrid.Group
                direction="row"
                pageKey="workspace"
                growPanelKey="center"
                collapse={collapse}
            >
                <WorkspaceGrid.Panel
                    panelKey="left"
                    initialSize="320px"
                    minSize="300px"
                    maxSize="800px"
                >
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Left}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel
                    panelKey="center"
                    initialSize="800px"
                    minSize="600px"
                    maxSize="9999px"
                >
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Center}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel
                    panelKey="right"
                    initialSize="320px"
                    minSize="300px"
                    maxSize="800px"
                >
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Right}
                    />
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
