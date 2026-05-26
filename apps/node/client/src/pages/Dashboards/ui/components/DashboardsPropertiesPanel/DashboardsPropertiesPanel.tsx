import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import {
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
} from '@/entities/dashboard';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Button, PanelPlaceholder, StatusMessage, Table } from '@/shared/ui';

import { selectDashboard, selectSelectedDashboardId } from '../../../model';

import styles from '../../DashboardsPage.module.scss';

export const DashboardsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);
    const [deleteDashboard, deleteDashboardState] = useDeleteDashboardMutation();
    const selectedDashboardId = useSelector(selectSelectedDashboardId);
    const dashboardQuery = useGetDashboardQuery(selectedDashboardId ?? skipToken, {
        refetchOnMountOrArgChange: true,
    });

    const selectedListDashboard = useMemo(
        () => getSelected(dashboardsQuery.data, selectedDashboardId),
        [dashboardsQuery.data, selectedDashboardId]
    );
    const selectedDashboard = dashboardQuery.data ?? selectedListDashboard;
    const widgetsCount = dashboardQuery.data
        ? dashboardQuery.data.items.length
        : 'Loading...';

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

    if (!selectedDashboard) {
        return (
            <PanelPlaceholder>Select a dashboard to view properties.</PanelPlaceholder>
        );
    }

    return (
        <section className={styles['right-section']} aria-label="Dashboard properties">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Properties</span>
                <h3 className={styles['title']}>{selectedDashboard.name}</h3>
            </div>

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
