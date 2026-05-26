import { Pencil, RefreshCcw, Trash2 } from 'lucide-react';

import { ChartResult, type Chart, type ChartResponse } from '@/entities/chart';

import { formatDate } from '@/shared/lib/formatDate';
import { Button } from '@/shared/ui';

import { chartsTestIds } from '../../../const';

import styles from './SavedChartDetails.module.scss';

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
        <div className={styles['detail-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Chart</span>
                <h2 className={styles['title']}>{chart.name}</h2>
                <p className={styles['muted']}>
                    {chart.chartType} &middot; dataset {chart.datasetId.slice(0, 8)}
                </p>
            </div>
            <div data-stack="h" data-gap="sm">
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
            </div>
        </div>

        {error && (
            <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                {error}
            </div>
        )}

        {isLoadingData && <div className={styles['status']}>Loading chart data...</div>}

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
