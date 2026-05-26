import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import {
    selectIsLeftCollapsed,
    selectIsRightCollapsed,
    WorkspaceGrid,
} from '@/widgets/WorkspaceGrid';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

import styles from './WorkspaceLayout.module.scss';

const ActionsListPanel = lazy(() =>
    import('@/pages/Actions').then(module => ({
        default: module.ActionsListPanel,
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

const ChartsListPanel = lazy(() =>
    import('@/pages/Charts').then(module => ({
        default: module.ChartsListPanel,
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

const DashboardsListPanel = lazy(() =>
    import('@/pages/Dashboards').then(module => ({
        default: module.DashboardsListPanel,
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

const WORKSPACE_SLOTS: Record<string, WorkspaceSlots> = {
    '/actions': {
        Left: ActionsListPanel,
        Center: ActionsWorkspace,
        Right: ActionsRightPanel,
    },
    '/charts': {
        Left: ChartsListPanel,
        Center: ChartsWorkspace,
        Right: ChartsWorkspaceRightPanel,
    },
    '/datasets': {
        Left: DatasetsLeftPanel,
        Center: DatasetsWorkspace,
        Right: DatasetsRightPanel,
    },
    '/dashboards': {
        Left: DashboardsListPanel,
        Center: DashboardsWorkspace,
        Right: DashboardsWorkspaceRightPanel,
    },
};

const workspaceFallback = <div className={styles['panel-fallback']} />;

export const WorkspaceLayout = () => {
    const { pathname } = useLocation();
    const isLeftCollapsed = useSelector(selectIsLeftCollapsed);
    const isRightCollapsed = useSelector(selectIsRightCollapsed);

    const slots = WORKSPACE_SLOTS[pathname];

    if (!slots) {
        return null;
    }

    const { Left, Center, Right } = slots;

    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group
                direction="row"
                pageKey="workspace"
                collapseLeft={isLeftCollapsed}
                collapseRight={isRightCollapsed}
            >
                <WorkspaceGrid.Panel initialSize="320px" minSize="300px" maxSize="800px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Left}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="800px" minSize="600px" maxSize="9999px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Center}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="320px" minSize="300px" maxSize="800px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Right}
                    />
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
