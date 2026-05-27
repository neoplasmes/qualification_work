import { ChartResult, type ChartResponse } from '@/entities/chart';

import { formatDate } from '@/shared/lib/formatDate';
import { StatusMessage } from '@/shared/ui';

type SavedChartDetailsProps = {
    chartResult: ChartResponse | null;
    error: string;
    isLoadingData: boolean;
};

export const SavedChartDetails = ({
    chartResult,
    error,
    isLoadingData,
}: SavedChartDetailsProps) => (
    <>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}

        {isLoadingData && <StatusMessage>Loading chart data...</StatusMessage>}

        {chartResult && (
            <ChartResult
                data={chartResult}
                kind={chartResult.kind}
                ariaLabel="Saved chart result"
                hideTable
            >
                <span>Aggregated at {formatDate(chartResult.aggregatedAt)}</span>
            </ChartResult>
        )}
    </>
);
