import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';

import type { ChartsWorkspaceMode } from '../model';

export const useChartDataResult = (
    orgId: string,
    chartId: string | null,
    workspaceMode: ChartsWorkspaceMode
) => {
    const query = useRead(
        useDependencies().getChartData,
        { orgId, chartId: chartId ?? '' },
        { enabled: Boolean(orgId && chartId && workspaceMode === 'view') }
    );
    const chartResult = query.data ?? null;

    return {
        chartResult,
        error: query.error
            ? getApiErrorMessage(query.error, 'Не удалось загрузить данные графика.')
            : '',
        isFetching: !chartResult && (query.isPending || query.isFetching),
    };
};
