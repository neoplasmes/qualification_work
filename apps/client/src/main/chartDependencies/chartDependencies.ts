import { chartCodec, chartListCodec, valueCodec } from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { HttpChartRepo } from '@/env/repos/chart';
import type { HttpTransport } from '@/env/transport/http';

import { createCreateChart } from '@/app/commands/createChart';
import { createDeleteChart } from '@/app/commands/deleteChart';
import { createPatchChart } from '@/app/commands/patchChart';
import { createUpdateChart } from '@/app/commands/updateChart';
import { createGetChart } from '@/app/queries/getChart';
import { createGetChartData } from '@/app/queries/getChartData';
import { createListCharts } from '@/app/queries/listCharts';
import { createPreviewChartData } from '@/app/queries/previewChartData';

export function createChartDependencies(cache: CacheRuntime, transport: HttpTransport) {
    const repo = new HttpChartRepo(transport);
    const operations = {
        listCharts: createListCharts(repo),
        getChart: createGetChart(repo),
        getChartData: createGetChartData(repo),
        previewChartData: createPreviewChartData(repo),
        createChart: createCreateChart(repo),
        updateChart: createUpdateChart(repo),
        patchChart: createPatchChart(repo),
        deleteChart: createDeleteChart(repo),
    };
    cache.registerRead(operations.listCharts, chartListCodec);
    cache.registerRead(operations.getChart, chartCodec);
    cache.registerRead(operations.getChartData, valueCodec());
    cache.registerRead(operations.previewChartData, valueCodec());
    cache.registerCommand(operations.createChart, {
        conflictKey: input => `chart:${input.orgId}/new`,
        affected: () => ['chart'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.updateChart, {
        conflictKey: input => `chart:${input.orgId}/${input.chartId}`,
        affected: input => operations.updateChart.writes(input, undefined),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.patchChart, {
        conflictKey: input => `chart:${input.orgId}/${input.chartId}`,
        affected: input => operations.patchChart.writes(input, undefined),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.deleteChart, {
        conflictKey: input => `chart:${input.orgId}/${input.chartId}`,
        affected: input => operations.deleteChart.writes(input, undefined),
        codec: valueCodec(),
        removals: input => [
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.chartId)}`,
        ],
    });

    return operations;
}
