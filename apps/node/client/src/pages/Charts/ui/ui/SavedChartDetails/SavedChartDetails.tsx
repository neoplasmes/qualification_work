import {
    ChartConfigSummary,
    ChartResult,
    type Chart,
    type ChartResponse,
} from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { StatusMessage } from '@/shared/ui';

type SavedChartDetailsProps = {
    chart: Chart;
    columns: DatasetColumn[];
    chartResult: ChartResponse | null;
    error: string;
    isLoadingData: boolean;
};

export const SavedChartDetails = ({
    chart,
    columns,
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
                <div data-stack="v" data-gap="xs">
                    <ChartConfigSummary
                        chartType={chart.chartType}
                        config={chart.config}
                        columns={columns}
                    />
                    <span>Aggregated at {formatDate(chartResult.aggregatedAt)}</span>
                </div>
            </ChartResult>
        )}
    </>
);
