import { Trash2 } from 'lucide-react';

import type { Dashboard } from '@/entities/dashboard';

import { Button } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import styles from './WorkspaceHeader.module.scss';

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
    <div className={styles['detail-header']}>
        <div data-stack="v" data-gap="xs">
            <span className={styles['eyebrow']}>Dashboard</span>
            <h2 className={styles['title']}>{dashboard.name}</h2>
            <p className={styles['muted']}>{widgetsCount} widgets</p>
        </div>
        <Button
            variant="danger"
            data-test-id={dashboardsTestIds.deleteButton}
            disabled={deleteDisabled}
            onClick={onDelete}
        >
            <Trash2 size={18} />
            {deleteConfirmationId === dashboard.id ? 'Confirm delete' : 'Delete'}
        </Button>
    </div>
);
