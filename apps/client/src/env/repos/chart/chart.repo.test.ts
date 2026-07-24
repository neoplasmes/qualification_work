import { HttpChartRepo } from '.';
import { HttpTransport } from '@/env/transport/http';
import { describe, expect, it, vi } from 'vitest';

const config = {
    kind: 'bar' as const,
    dimension: { columnId: 'category' },
    measures: [{ aggregate: 'count' as const }],
};
const data = {
    kind: 'bar',
    columns: [],
    rows: [],
    truncated: false,
    aggregatedAt: '2026-01-01',
};
const chart = {
    id: 'chart/1',
    orgId: 'org/1',
    datasetId: 'dataset/1',
    name: 'График',
    chartType: 'bar',
    config,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
};

describe('chart repository', () => {
    it('round trips Unicode filters as UTF-8 base64url', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(Response.json(data));
        const repo = new HttpChartRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const filterOverrides = [
            { columnId: 'column/1', op: 'eq' as const, value: 'Москва 🦉' },
        ];
        await repo.getChartData({ orgId: 'org/1', chartId: 'chart/1', filterOverrides });
        const url = String(fetch.mock.calls[0]![0]);
        expect(url).toContain('/data/charts/chart%2F1/data?filterOverrides=');
        const encoded = url.split('filterOverrides=')[1]!;
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))).toEqual(
            filterOverrides
        );
    });

    it('cancels preview POST and strips cache-only organization scope', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () =>
                        reject(new DOMException('cancelled', 'AbortError'))
                    );
                })
        );
        const repo = new HttpChartRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const controller = new AbortController();
        const input = {
            orgId: 'org/1',
            datasetId: 'dataset/1',
            chartType: 'bar' as const,
            config,
            filterOverrides: [
                { columnId: 'category', op: 'eq' as const, value: 'Москва' },
            ],
        };
        const pending = repo.previewChartData(input, { signal: controller.signal });
        controller.abort();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetch.mock.calls[0]![1]).toMatchObject({
            method: 'POST',
            signal: controller.signal,
        });
        expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
            datasetId: input.datasetId,
            chartType: input.chartType,
            config,
            filterOverrides: input.filterOverrides,
        });
    });

    it('keeps create receipts distinct from detail and accepts void acknowledgements', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(Response.json({ id: chart.id }))
            .mockResolvedValueOnce(Response.json(chart))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }));
        const repo = new HttpChartRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const receipt = await repo.createChart({
            orgId: chart.orgId,
            datasetId: chart.datasetId,
            name: chart.name,
            chartType: 'bar',
            config,
        });
        expect(receipt).toEqual({ id: chart.id });
        const scope = { orgId: chart.orgId, chartId: receipt.id };
        expect(await repo.getChart(scope)).toEqual({
            ...chart,
            ref: 'chart:org%2F1/chart%2F1',
        });
        await expect(repo.updateChart({ ...scope, config })).resolves.toBeUndefined();
        await expect(
            repo.patchChart({ ...scope, name: 'renamed' })
        ).resolves.toBeUndefined();
        await expect(repo.deleteChart(scope)).resolves.toBeUndefined();
        expect(JSON.parse(String(fetch.mock.calls[2]![1]?.body))).toEqual({ config });
    });
});

it('rejects a detail response from another scope', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json({ ...chart, orgId: 'another' }));
    const repo = new HttpChartRepo(new HttpTransport({ baseUrl: '/api', fetch }));
    await expect(
        repo.getChart({ orgId: chart.orgId, chartId: chart.id })
    ).rejects.toThrow('Unexpected chart scope');
});
