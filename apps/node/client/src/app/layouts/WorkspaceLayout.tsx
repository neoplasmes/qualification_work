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
const ChartsFilterPanel = lazy(() =>
    import('@/pages/Charts').then(module => ({
        default: module.ChartsFilterPanel,
    }))
);

const DatasetsUploadPanel = lazy(() =>
    import('@/pages/Datasets').then(module => ({
        default: module.DatasetsUploadPanel,
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
const DashboardsFilterPanel = lazy(() =>
    import('@/pages/Dashboards').then(module => ({
        default: module.DashboardsFilterPanel,
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
        Right: ChartsFilterPanel,
    },
    '/datasets': {
        Left: DatasetsUploadPanel,
        Center: DatasetsWorkspace,
        Right: DatasetsRightPanel,
    },
    '/dashboards': {
        Left: DashboardsListPanel,
        Center: DashboardsWorkspace,
        Right: DashboardsFilterPanel,
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
                <WorkspaceGrid.Panel initialSize="320px" minSize="240px" maxSize="480px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Left}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="800px" minSize="480px" maxSize="9999px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Center}
                    />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="320px" minSize="240px" maxSize="480px">
                    <ClientOnlyDeffered
                        fallback={workspaceFallback}
                        LazyComponent={Right}
                    />
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
