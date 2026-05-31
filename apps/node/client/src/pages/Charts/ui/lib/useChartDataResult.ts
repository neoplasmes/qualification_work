import { useEffect, useRef, useState } from 'react';

import {
    useLazyGetChartDataQuery,
    type ChartResponse,
    type FilterClause,
} from '@/entities/chart';

import { getApiErrorMessage } from '@/shared/api';

import type { ChartsWorkspaceMode } from '../../model';

type ChartResultState = {
    chartId: string;
    data: ChartResponse;
} | null;

export const useChartDataResult = (
    chartId: string | null,
    workspaceMode: ChartsWorkspaceMode
) => {
    const [error, setError] = useState('');
    const [chartResult, setChartResult] = useState<ChartResultState>(null);
    const chartDataRequestRef = useRef(0);
    const [getChartData, chartDataQuery] = useLazyGetChartDataQuery();

    const loadChartData = async (
        nextChartId: string,
        filterOverrides?: FilterClause[]
    ) => {
        const requestId = chartDataRequestRef.current + 1;
        chartDataRequestRef.current = requestId;

        let data: ChartResponse;

        try {
            data = await getChartData(
                filterOverrides ? { chartId: nextChartId, filterOverrides } : nextChartId,
                false
            ).unwrap();
        } catch (loadError) {
            if (chartDataRequestRef.current !== requestId) {
                return undefined;
            }

            throw loadError;
        }

        if (chartDataRequestRef.current === requestId) {
            setChartResult({ chartId: nextChartId, data });
        }

        return data;
    };

    useEffect(() => {
        if (!chartId) {
            setChartResult(null);

            return;
        }

        if (workspaceMode !== 'view') {
            return;
        }

        setError('');
        setChartResult(null);
        void loadChartData(chartId).catch(loadError => {
            setError(getApiErrorMessage(loadError, 'Unable to load chart data.'));
        });
    }, [chartId, workspaceMode]);

    return {
        chartResult: chartResult?.chartId === chartId ? chartResult.data : null,
        error,
        isFetching: chartDataQuery.isFetching,
    };
};
