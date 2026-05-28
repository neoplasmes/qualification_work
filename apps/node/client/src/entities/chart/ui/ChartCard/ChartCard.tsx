import { formatDate } from '@/shared/lib/formatDate';

import type { Chart, ChartResponse } from '../../api';
import { BAR_CHART_ROWS_LIMIT } from '../../const';
import { getChartColorFromConfig } from '../../lib';
import { ChartConfigSummary } from '../ChartConfigSummary';
import { ChartResult } from '../ChartResult';

type ChartCardColumn = {
    id: string;
    displayName: string;
};

type ChartCardProps = {
    chart?: Chart;
    columns: readonly ChartCardColumn[];
    data: ChartResponse;
    ariaLabel: string;
};

export const ChartCard = ({ chart, columns, data, ariaLabel }: ChartCardProps) => (
    <ChartResult
        data={data}
        kind={data.kind}
        ariaLabel={ariaLabel}
        color={chart ? getChartColorFromConfig(chart.config) : undefined}
        barsLimit={BAR_CHART_ROWS_LIMIT}
        hideTable
    >
        {chart && (
            <div data-stack="v" data-gap="xs">
                <ChartConfigSummary
                    chartType={chart.chartType}
                    config={chart.config}
                    columns={columns}
                />
                <span>Aggregated at {formatDate(data.aggregatedAt)}</span>
            </div>
        )}
    </ChartResult>
);
