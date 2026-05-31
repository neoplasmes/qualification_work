import { ChartCard, type Chart, type ChartResponse } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

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
            <ChartCard
                chart={chart}
                columns={columns}
                data={chartResult}
                ariaLabel="Saved chart result"
                transparentBackground
            />
        )}
    </>
);
