import {
    useDashboardsPageActions,
    useDashboardsPageState,
} from '@/ui/pages/dashboards/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button } from '@qualification-work/design-system';
import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useRenameDashboardMutation } from '@/features/manageDashboards';

import {
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
} from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { EditableText, StatusMessage, Table } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';
import { dashboardsWorkspaceIndexPath } from '../../lib';

import styles from './DashboardsPropertiesPanel.module.css';

export const DashboardsPropertiesPanel = () => {
    const { selectDashboard } = useDashboardsPageActions();
    const navigate = useNavigate();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const [renameDashboard, renameState] = useRenameDashboardMutation();
    const [deleteDashboard, deleteDashboardState] = useDeleteDashboardMutation();
    const selectedDashboardId = useDashboardsPageState(
        state => state.selectedDashboardId
    );

    const selectedListDashboard = useMemo(() => {
        if (selectedDashboardId === null) {
            return undefined;
        }

        return getSelected(dashboardsQuery.data, selectedDashboardId);
    }, [dashboardsQuery.data, selectedDashboardId]);
    const dashboardId = selectedListDashboard?.id;
    const dashboardQuery = useGetDashboardQuery(dashboardId ?? skipToken, {
        refetchOnMountOrArgChange: true,
    });

    const selectedDashboard = dashboardQuery.currentData;

    const handleDelete = async () => {
        if (!selectedDashboard) {
            return;
        }

        if (deleteConfirmationId !== selectedDashboard.id) {
            setDeleteConfirmationId(selectedDashboard.id);

            return;
        }

        try {
            await deleteDashboard(selectedDashboard.id).unwrap();
            selectDashboard(null);
            navigate(dashboardsWorkspaceIndexPath, { replace: true });
            setDeleteConfirmationId(null);
            await dashboardsQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this dashboard.'));
        }
    };

    const handleRenameDashboard = async (name: string) => {
        if (!selectedDashboard) {
            return;
        }

        try {
            setError('');
            await renameDashboard({ dashboardId: selectedDashboard.id, name }).unwrap();
            await dashboardsQuery.refetch();
            await dashboardQuery.refetch();
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this dashboard.'
            );
            setError(message);

            throw new Error(message);
        }
    };

    if (!selectedListDashboard) {
        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Select a dashboard to view properties.
            </p>
        );
    }

    if (!selectedDashboard) {
        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Loading dashboard...
            </p>
        );
    }

    const widgetsCount = selectedDashboard.items.length;

    return (
        <section data-stack="v" data-gap="md" aria-label="Dashboard properties">
            <EditableText
                title={selectedDashboard.name}
                fallbackTitle="Untitled dashboard"
                saving={renameState.isLoading}
                editButtonTestId={dashboardsTestIds.renameButton}
                inputTestId={dashboardsTestIds.renameInput}
                onRename={handleRenameDashboard}
            />

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <Table
                aria-label="Dashboard properties"
                headers={{ key: 'Property', value: 'Value' }}
                rows={[
                    { key: 'Widgets', value: widgetsCount },
                    { key: 'Created', value: formatDate(selectedDashboard.createdAt) },
                    { key: 'Updated', value: formatDate(selectedDashboard.updatedAt) },
                ]}
            />

            <Button
                variant="danger"
                data-test-id={dashboardsTestIds.deleteButton}
                disabled={deleteDashboardState.isLoading}
                onClick={() => void handleDelete()}
            >
                <Trash2 size={18} />
                {deleteConfirmationId === selectedDashboard.id
                    ? 'Confirm delete'
                    : 'Delete dashboard'}
            </Button>
        </section>
    );
};
