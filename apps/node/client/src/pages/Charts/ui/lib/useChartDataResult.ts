import { skipToken } from '@reduxjs/toolkit/query';

import { useGetChartDataQuery, type ChartResponse } from '@/entities/chart';

import { getApiErrorMessage } from '@/shared/api';

import type { ChartsWorkspaceMode } from '../../model';

export const useChartDataResult = (
    chartId: string | null,
    workspaceMode: ChartsWorkspaceMode
) => {
    const queryArg = chartId && workspaceMode === 'view' ? chartId : skipToken;
    const chartDataQuery = useGetChartDataQuery(queryArg);
    const chartResult: ChartResponse | null = chartDataQuery.currentData ?? null;
    const error = chartDataQuery.error
        ? getApiErrorMessage(chartDataQuery.error, 'Unable to load chart data.')
        : '';

    return {
        chartResult,
        error,
        isFetching:
            !chartResult && (chartDataQuery.isLoading || chartDataQuery.isFetching),
    };
};
