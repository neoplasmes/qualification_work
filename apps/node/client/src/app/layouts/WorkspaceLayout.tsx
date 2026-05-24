import { useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import type { ComponentType } from 'react';

import { WorkspaceGrid, selectIsLeftCollapsed, selectIsRightCollapsed } from '@/widgets/WorkspaceGrid';

import { ChartsListPanel, ChartsWorkspace, ChartsFilterPanel } from '@/pages/Charts';
import { DatasetsUploadPanel, DatasetsWorkspace, DatasetsRightPanel } from '@/pages/Datasets';
import {
    DashboardsListPanel,
    DashboardsWorkspace,
    DashboardsFilterPanel,
} from '@/pages/Dashboards';

type WorkspaceSlots = {
    Left: ComponentType;
    Center: ComponentType;
    Right: ComponentType;
};

const WORKSPACE_SLOTS: Record<string, WorkspaceSlots> = {
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

export const WorkspaceLayout = () => {
    const { pathname } = useLocation();
    const isLeftCollapsed = useSelector(selectIsLeftCollapsed);
    const isRightCollapsed = useSelector(selectIsRightCollapsed);

    const slots = WORKSPACE_SLOTS[pathname];

    if (!slots) {return null;}

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
                    <Left />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="800px" minSize="480px" maxSize="9999px">
                    <Center />
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel initialSize="320px" minSize="240px" maxSize="480px">
                    <Right />
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
