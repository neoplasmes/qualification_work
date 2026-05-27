import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';
import { usePatchChartMutation } from '@/features/buildChart';

import { useDeleteChartMutation, useListChartsQuery } from '@/entities/chart';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Button, PanelPlaceholder, StatusMessage, Table } from '@/shared/ui';

import { chartsTestIds } from '../../../const';
import { selectChart, selectSelectedChartId } from '../../../model';

export const ChartsPropertiesPanel = () => {
    const dispatch = useDispatch();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [patchChart, patchChartState] = usePatchChartMutation();
    const [deleteChart, deleteChartState] = useDeleteChartMutation();
    const selectedChartId = useSelector(selectSelectedChartId);

    const selectedChart = useMemo(
        () => getSelected(chartsQuery.data, selectedChartId),
        [chartsQuery.data, selectedChartId]
    );
    const selectedDatasetName = useMemo(
        () =>
            selectedChart
                ? (datasetsQuery.data?.find(
                      item => item.dataset.id === selectedChart.datasetId
                  )?.dataset.name ?? 'Unknown dataset')
                : '',
        [datasetsQuery.data, selectedChart]
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

    const handleRenameChart = async (name: string) => {
        // editor only renders when a chart is selected; bail loudly if invariant breaks
        // (silent return would leave the editor showing the new name while server keeps old)
        if (!selectedChart) {
            throw new Error('No chart selected for rename.');
        }

        try {
            setError('');
            await patchChart({ chartId: selectedChart.id, name }).unwrap();
            await chartsQuery.refetch();
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this chart.'
            );
            setError(message);

            throw new Error(message);
        }
    };

    if (!selectedChart) {
        return <PanelPlaceholder>Select a chart to view properties.</PanelPlaceholder>;
    }

    return (
        <section data-display="grid" data-gap="md" aria-label="Chart properties">
            <WorkspaceTitleEditor
                title={selectedChart.name}
                fallbackTitle="Untitled chart"
                saving={patchChartState.isLoading}
                editButtonTestId={chartsTestIds.renameButton}
                inputTestId={chartsTestIds.renameInput}
                onRename={handleRenameChart}
            />

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <Table
                aria-label="Chart properties"
                headers={{ key: 'Property', value: 'Value' }}
                rows={[
                    { key: 'Type', value: selectedChart.chartType },
                    { key: 'Dataset', value: selectedDatasetName },
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
