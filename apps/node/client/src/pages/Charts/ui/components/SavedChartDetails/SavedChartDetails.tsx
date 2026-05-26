import { Pencil, RefreshCcw, Trash2 } from 'lucide-react';

import { ChartResult, type Chart, type ChartResponse } from '@/entities/chart';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, EntityHeader, StatusMessage } from '@/shared/ui';

import { chartsTestIds } from '../../../const';

type SavedChartDetailsProps = {
    chart: Chart;
    chartResult: ChartResponse | null;
    error: string;
    isLoadingData: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    deleteConfirmationId: string | null;
    onEdit: () => void;
    onRefreshData: () => void;
    onDelete: () => void;
};

export const SavedChartDetails = ({
    chart,
    chartResult,
    error,
    isLoadingData,
    isDeleting,
    canEdit,
    deleteConfirmationId,
    onEdit,
    onRefreshData,
    onDelete,
}: SavedChartDetailsProps) => (
    <>
        <EntityHeader
            eyebrow="Chart"
            title={chart.name}
            description={`${chart.chartType} · dataset ${chart.datasetId.slice(0, 8)}`}
            actions={
                <>
                    <Button
                        data-test-id={chartsTestIds.editButton}
                        disabled={!canEdit}
                        onClick={onEdit}
                    >
                        <Pencil size={18} />
                        Edit
                    </Button>
                    <Button
                        data-test-id={chartsTestIds.refreshDataButton}
                        disabled={isLoadingData}
                        onClick={onRefreshData}
                    >
                        <RefreshCcw size={18} />
                        Refresh data
                    </Button>
                    <Button
                        variant="danger"
                        data-test-id={chartsTestIds.deleteButton}
                        disabled={isDeleting}
                        onClick={onDelete}
                    >
                        <Trash2 size={18} />
                        {deleteConfirmationId === chart.id ? 'Confirm delete' : 'Delete'}
                    </Button>
                </>
            }
        />

        {error && <StatusMessage tone="error">{error}</StatusMessage>}

        {isLoadingData && <StatusMessage>Loading chart data...</StatusMessage>}

        {chartResult && (
            <ChartResult
                data={chartResult}
                kind={chartResult.kind}
                ariaLabel="Saved chart result"
            >
                <span>Aggregated at {formatDate(chartResult.aggregatedAt)}</span>
            </ChartResult>
        )}
    </>
);
