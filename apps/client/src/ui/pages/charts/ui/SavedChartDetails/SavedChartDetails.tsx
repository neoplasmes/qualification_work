import type { Chart, ChartData as ChartResponse } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { ChartConfigSummary } from '@/ui/widgets/ChartConfigSummary';
import { ChartShell, getChartColorFromConfig } from '@/ui/widgets/ChartShell';

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
            <>
                <ChartConfigSummary
                    config={chart.config}
                    columns={columns}
                    chartType={chart.chartType}
                />
                <ChartShell
                    data={chartResult}
                    kind={chart.chartType}
                    color={getChartColorFromConfig(chart.config)}
                    ariaLabel="Saved chart result"
                />
            </>
        )}
    </>
);
