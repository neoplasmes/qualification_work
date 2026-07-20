import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button } from '@qualification-work/design-system';
import { skipToken } from '@reduxjs/toolkit/query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { usePatchChartMutation } from '@/features/buildChart';

import { useDeleteChartMutation, useGetChartQuery } from '@/entities/chart';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { EditableText, StatusMessage, Table } from '@/shared/ui';

import { chartsTestIds } from '../../const';
import { chartsWorkspaceIndexPath } from '../../lib';

import styles from './ChartsPropertiesPanel.module.css';

export const ChartsPropertiesPanel = () => {
    const { selectChart } = useChartsPageActions();
    const navigate = useNavigate();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const [patchChart, patchChartState] = usePatchChartMutation();
    const [deleteChart, deleteChartState] = useDeleteChartMutation();
    const selectedChartId = useChartsPageState(state => state.selectedChartId);
    const selectedChartQuery = useGetChartQuery(selectedChartId ?? skipToken);
    const selectedChart = selectedChartQuery.data ?? null;
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
            selectChart(null);
            navigate(chartsWorkspaceIndexPath, { replace: true });
            setDeleteConfirmationId(null);
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
            await selectedChartQuery.refetch();
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
        if (selectedChartId && selectedChartQuery.isLoading) {
            return <StatusMessage>Loading chart properties...</StatusMessage>;
        }

        if (selectedChartId && selectedChartQuery.isError) {
            return (
                <StatusMessage tone="error">
                    Unable to load this chart properties.
                </StatusMessage>
            );
        }

        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Select a chart to view properties.
            </p>
        );
    }

    return (
        <section data-stack="v" data-gap="md" aria-label="Chart properties">
            <EditableText
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
