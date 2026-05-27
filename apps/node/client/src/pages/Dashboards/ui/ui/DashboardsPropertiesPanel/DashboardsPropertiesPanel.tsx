import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { useRenameDashboardMutation } from '@/features/manageDashboards';

import {
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
} from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Button, PanelPlaceholder, StatusMessage, Table } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';
import { selectDashboard, selectSelectedDashboardId } from '../../../model';

export const DashboardsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const [renameDashboard, renameState] = useRenameDashboardMutation();
    const [deleteDashboard, deleteDashboardState] = useDeleteDashboardMutation();
    const selectedDashboardId = useSelector(selectSelectedDashboardId);

    const selectedListDashboard = useMemo(
        () => getSelected(dashboardsQuery.data, selectedDashboardId),
        [dashboardsQuery.data, selectedDashboardId]
    );
    const dashboardId = selectedListDashboard?.id;
    const dashboardQuery = useGetDashboardQuery(dashboardId ?? skipToken, {
        refetchOnMountOrArgChange: true,
    });

    const selectedDashboard = dashboardQuery.data ?? selectedListDashboard;
    const widgetsCount = dashboardQuery.data?.items.length ?? 'Loading...';

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
            dispatch(selectDashboard(null));
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

    if (!selectedDashboard) {
        return (
            <PanelPlaceholder>Select a dashboard to view properties.</PanelPlaceholder>
        );
    }

    return (
        <section data-display="grid" data-gap="md" aria-label="Dashboard properties">
            <WorkspaceTitleEditor
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
