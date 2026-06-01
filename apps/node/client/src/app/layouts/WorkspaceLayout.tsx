import { lazy, useMemo, type ComponentType, type LazyExoticComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import { getActionsWorkspaceBasePath } from '@/pages/Actions';
import { getChartsWorkspaceBasePath } from '@/pages/Charts';

import {
    selectIsLeftCollapsed,
    selectIsRightCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    WorkspaceGrid,
    type WorkspaceGridCollapseController,
} from '@/widgets/WorkspaceGrid';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

import styles from './WorkspaceLayout.module.scss';

const ActionsLeftPanel = lazy(() =>
    import('@/pages/Actions').then(module => ({
        default: module.ActionsLeftPanel,
    }))
);
const ActionsWorkspace = lazy(() =>
    import('@/pages/Actions').then(module => ({
        default: module.ActionsWorkspace,
    }))
);
const ActionsRightPanel = lazy(() =>
    import('@/pages/Actions').then(module => ({
        default: module.ActionsRightPanel,
    }))
);

const ChartsLeftPanel = lazy(() =>
    import('@/pages/Charts').then(module => ({
        default: module.ChartsLeftPanel,
    }))
);
const ChartsWorkspace = lazy(() =>
    import('@/pages/Charts').then(module => ({
        default: module.ChartsWorkspace,
    }))
);
const ChartsWorkspaceRightPanel = lazy(() =>
    import('@/pages/Charts').then(module => ({
        default: module.ChartsWorkspaceRightPanel,
    }))
);

const DatasetsLeftPanel = lazy(() =>
    import('@/pages/Datasets').then(module => ({
        default: module.DatasetsLeftPanel,
    }))
);
const DatasetsWorkspace = lazy(() =>
    import('@/pages/Datasets').then(module => ({
        default: module.DatasetsWorkspace,
    }))
);
const DatasetsRightPanel = lazy(() =>
    import('@/pages/Datasets').then(module => ({
        default: module.DatasetsRightPanel,
    }))
);

const DashboardsLeftPanel = lazy(() =>
    import('@/pages/Dashboards').then(module => ({
        default: module.DashboardsLeftPanel,
    }))
);
const DashboardsWorkspace = lazy(() =>
    import('@/pages/Dashboards').then(module => ({
        default: module.DashboardsWorkspace,
    }))
);
const DashboardsWorkspaceRightPanel = lazy(() =>
    import('@/pages/Dashboards').then(module => ({
        default: module.DashboardsWorkspaceRightPanel,
    }))
);

type WorkspaceSlot = LazyExoticComponent<ComponentType>;

type WorkspaceSlots = {
    Left: WorkspaceSlot;
    Center: WorkspaceSlot;
    Right: WorkspaceSlot;
};

const workspaceSlots: Record<string, WorkspaceSlots> = {
    '/actions': {
        Left: ActionsLeftPanel,
        Center: ActionsWorkspace,
        Right: ActionsRightPanel,
    },
    '/charts': {
        Left: ChartsLeftPanel,
        Center: ChartsWorkspace,
        Right: ChartsWorkspaceRightPanel,
    },
    '/datasets': {
        Left: DatasetsLeftPanel,
        Center: DatasetsWorkspace,
        Right: DatasetsRightPanel,
    },
    '/dashboards': {
        Left: DashboardsLeftPanel,
        Center: DashboardsWorkspace,
        Right: DashboardsWorkspaceRightPanel,
    },
};

const workspaceFallback = <div className={styles['panel-fallback']} />;

type WorkspacePanelKey = 'left' | 'right';

export const WorkspaceLayout = () => {
    const { pathname } = useLocation();
    const dispatch = useDispatch();
    const isLeftCollapsed = useSelector(selectIsLeftCollapsed);
    const isRightCollapsed = useSelector(selectIsRightCollapsed);

    const collapse = useMemo<WorkspaceGridCollapseController<WorkspacePanelKey>>(() => {
        const collapsed = new Set<WorkspacePanelKey>();
        if (isLeftCollapsed) {
            collapsed.add('left');
        }
        if (isRightCollapsed) {
            collapsed.add('right');
        }

        const toggle = (key: WorkspacePanelKey) =>
            dispatch(key === 'left' ? toggleLeftPanel() : toggleRightPanel());

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
    }, [isLeftCollapsed, isRightCollapsed, dispatch]);

    const workspaceBasePath = getActionsWorkspaceBasePath(
        getChartsWorkspaceBasePath(pathname)
    );
    const slots = workspaceSlots[workspaceBasePath];

    if (!slots) {
        return null;
    }

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
