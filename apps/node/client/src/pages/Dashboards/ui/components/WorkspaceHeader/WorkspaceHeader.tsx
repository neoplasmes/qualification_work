import { Trash2 } from 'lucide-react';

import type { Dashboard } from '@/entities/dashboard';

import { Button, EntityHeader } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

type WorkspaceHeaderProps = {
    dashboard: Dashboard;
    widgetsCount: number;
    deleteConfirmationId: string | null;
    deleteDisabled: boolean;
    onDelete: () => void;
};

export const WorkspaceHeader = ({
    dashboard,
    widgetsCount,
    deleteConfirmationId,
    deleteDisabled,
    onDelete,
}: WorkspaceHeaderProps) => (
    <EntityHeader
        eyebrow="Dashboard"
        title={dashboard.name}
        description={`${widgetsCount} widgets`}
        actions={
            <Button
                variant="danger"
                data-test-id={dashboardsTestIds.deleteButton}
                disabled={deleteDisabled}
                onClick={onDelete}
            >
                <Trash2 size={18} />
                {deleteConfirmationId === dashboard.id ? 'Confirm delete' : 'Delete'}
            </Button>
        }
    />
);
