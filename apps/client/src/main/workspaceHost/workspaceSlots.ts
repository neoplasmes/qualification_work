import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const ActionsLeftPanel = lazy(() =>
    import('@/ui/pages/actions').then(module => ({
        default: module.ActionsLeftPanel,
    }))
);
const ActionsPage = lazy(() =>
    import('@/ui/pages/actions').then(module => ({
        default: module.ActionsPage,
    }))
);
const ActionsRightPanel = lazy(() =>
    import('@/ui/pages/actions').then(module => ({
        default: module.ActionsRightPanel,
    }))
);

const ChartsLeftPanel = lazy(() =>
    import('@/ui/pages/charts').then(module => ({
        default: module.ChartsLeftPanel,
    }))
);
const ChartsPage = lazy(() =>
    import('@/ui/pages/charts').then(module => ({
        default: module.ChartsPage,
    }))
);
const ChartsRightPanel = lazy(() =>
    import('@/ui/pages/charts').then(module => ({
        default: module.ChartsRightPanel,
    }))
);

const DatasetsLeftPanel = lazy(() =>
    import('@/ui/pages/datasets').then(module => ({
        default: module.DatasetsLeftPanel,
    }))
);
const DatasetsPage = lazy(() =>
    import('@/ui/pages/datasets').then(module => ({
        default: module.DatasetsPage,
    }))
);
const DatasetsRightPanel = lazy(() =>
    import('@/ui/pages/datasets').then(module => ({
        default: module.DatasetsRightPanel,
    }))
);

const DashboardsLeftPanel = lazy(() =>
    import('@/ui/pages/dashboards').then(module => ({
        default: module.DashboardsLeftPanel,
    }))
);
const DashboardsPage = lazy(() =>
    import('@/ui/pages/dashboards').then(module => ({
        default: module.DashboardsPage,
    }))
);
const DashboardsRightPanel = lazy(() =>
    import('@/ui/pages/dashboards').then(module => ({
        default: module.DashboardsRightPanel,
    }))
);

export type WorkspaceSlot = LazyExoticComponent<ComponentType>;

export type WorkspaceSlots = {
    Left: WorkspaceSlot;
    Center: WorkspaceSlot;
    Right: WorkspaceSlot;
};

export const workspaceSlots: Record<string, WorkspaceSlots> = {
    '/actions': {
        Left: ActionsLeftPanel,
        Center: ActionsPage,
        Right: ActionsRightPanel,
    },
    '/charts': {
        Left: ChartsLeftPanel,
        Center: ChartsPage,
        Right: ChartsRightPanel,
    },
    '/datasets': {
        Left: DatasetsLeftPanel,
        Center: DatasetsPage,
        Right: DatasetsRightPanel,
    },
    '/dashboards': {
        Left: DashboardsLeftPanel,
        Center: DashboardsPage,
        Right: DashboardsRightPanel,
    },
};
