import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useDeleteChartMutation, useListChartsQuery } from '@/entities/chart';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Button, PanelPlaceholder, StatusMessage, Table } from '@/shared/ui';

import { selectChart, selectSelectedChartId } from '../../../model';

import styles from '../../ChartsPage.module.scss';

export const ChartsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const [deleteChart, deleteChartState] = useDeleteChartMutation();
    const selectedChartId = useSelector(selectSelectedChartId);

    const selectedChart = useMemo(
        () => getSelected(chartsQuery.data, selectedChartId),
        [chartsQuery.data, selectedChartId]
    );

    const handleDelete = async () => {
        if (!selectedChart) {
            return;
        }

        if (deleteConfirmationId !== selectedChart.id) {
            setDeleteConfirmationId(selectedChart.id);

            return;
        }

        try {
            await deleteChart(selectedChart.id).unwrap();
            dispatch(selectChart(null));
            setDeleteConfirmationId(null);
            await chartsQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this chart.'));
        }
    };

    if (!selectedChart) {
        return <PanelPlaceholder>Select a chart to view properties.</PanelPlaceholder>;
    }

    return (
        <section className={styles['right-section']} aria-label="Chart properties">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Properties</span>
                <h3 className={styles['title']}>{selectedChart.name}</h3>
            </div>

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <Table
                aria-label="Chart properties"
                headers={{ key: 'Property', value: 'Value' }}
                rows={[
                    { key: 'Type', value: selectedChart.chartType },
                    { key: 'Dataset', value: selectedChart.datasetId.slice(0, 8) },
                    { key: 'Created', value: formatDate(selectedChart.createdAt) },
                    { key: 'Updated', value: formatDate(selectedChart.updatedAt) },
                ]}
            />

            <Button
                variant="danger"
                disabled={deleteChartState.isLoading}
                onClick={() => void handleDelete()}
            >
                <Trash2 size={18} />
                {deleteConfirmationId === selectedChart.id
                    ? 'Confirm delete'
                    : 'Delete chart'}
            </Button>
        </section>
    );
};
