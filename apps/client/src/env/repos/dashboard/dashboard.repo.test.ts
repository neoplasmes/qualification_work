import { HttpDashboardRepo } from '.';
import { HttpTransport } from '@/env/transport/http';
import { expect, it, vi } from 'vitest';

it('accepts creation and item receipts without implicit reads', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(Response.json({ id: 'd1' }, { status: 201 }))
        .mockResolvedValueOnce(Response.json({ itemId: 'i1', posY: 2 }, { status: 201 }));
    const repo = new HttpDashboardRepo(new HttpTransport({ baseUrl: '', fetch }));
    await expect(repo.createDashboard({ orgId: 'o1', name: 'Board' })).resolves.toEqual({
        id: 'd1',
    });
    await expect(
        repo.addDashboardChart({
            orgId: 'o1',
            dashboardId: 'd1',
            chartId: 'c1',
            height: 4,
        })
    ).resolves.toEqual({ itemId: 'i1', posY: 2 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0]![0]).toBe('/dashboards');
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body))).toEqual({
        kind: 'chart',
        chartId: 'c1',
        height: 4,
    });
});

it('sends complete layout and accepts204', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
    const repo = new HttpDashboardRepo(new HttpTransport({ baseUrl: '', fetch }));
    const layout = [{ itemId: 'i1', posX: 0, posY: 0, width: 3, height: 2 }];
    await expect(
        repo.updateDashboardLayout({ orgId: 'o1', dashboardId: 'd1', layout })
    ).resolves.toBeUndefined();
    const requestPath = fetch.mock.calls[0]![0];
    const requestBody = JSON.parse(String(fetch.mock.calls[0]![1]?.body));
    expect(requestPath).toBe('/dashboards/d1/items/layout');
    expect(requestBody).toEqual({ layout });
});

it('preserves empty aggregate null and excludes cache scope from preview', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json({ value: null }));
    const repo = new HttpDashboardRepo(new HttpTransport({ baseUrl: '', fetch }));
    const signal = new AbortController().signal;
    const metricPreview = await repo.previewDashboardMetric(
        { orgId: 'o1', datasetId: 'data1', expression: 'sum(amount)' },
        { signal }
    );
    expect(metricPreview.value).toBeNull();
    expect(fetch.mock.calls[0]![0]).toBe('/dashboards/metrics/preview');
    expect(fetch.mock.calls[0]![1]?.signal).toBe(signal);
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
        datasetId: 'data1',
        expression: 'sum(amount)',
    });
});

it('preserves metric configuration and absent summary enrichment', async () => {
    const metric = {
        id: 'i/1',
        kind: 'metric',
        layout: { posX: 0, posY: 0, width: 3, height: 2 },
        datasetId: 'data1',
        name: 'Cost',
        expression: 'sum(amount)',
        format: '%',
        valueMultiplier: 100,
        target: 10,
        targetDirection: 'lower',
        showTrend: true,
        timeColumn: 'date',
        timeBucket: 'month',
    };
    const board = {
        id: 'd/1',
        orgId: 'o/1',
        name: 'Board',
        items: [metric],
        createdAt: 'now',
        updatedAt: 'now',
    };
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(Response.json([board]))
        .mockResolvedValueOnce(
            Response.json({
                ...board,
                items: [
                    { ...metric, value: null, trend: [{ bucket: '2026-01', value: 0 }] },
                ],
            })
        );
    const repo = new HttpDashboardRepo(new HttpTransport({ baseUrl: '', fetch }));
    const summary = (await repo.listDashboards({ orgId: 'o/1' }))[0]!;
    expect(summary.items[0]).not.toHaveProperty('value');
    expect(summary.items[0]).not.toHaveProperty('trend');
    expect(summary.items[0]?.ref).toBe('dashboardItem:o%2F1/d%2F1/i%2F1');
    const detail = await repo.getDashboard({ orgId: 'o/1', dashboardId: 'd/1' });
    expect(detail.items[0]).toMatchObject({
        ...metric,
        value: null,
        trend: [{ bucket: '2026-01', value: 0 }],
    });
    expect(fetch.mock.calls[1]![0]).toBe('/dashboards/d%2F1');
});

it('sends metric format multiplier target direction and trend without cache scope', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(Response.json({ itemId: 'i', posY: 0 }, { status: 201 }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const repo = new HttpDashboardRepo(new HttpTransport({ baseUrl: '', fetch }));
    const metric = {
        datasetId: 'data',
        name: 'Ratio',
        expression: 'sum(value) / sum(orders)',
        format: '%',
        valueMultiplier: 100,
        target: 6,
        targetDirection: 'lower' as const,
        showTrend: true,
        timeColumn: 'created',
        timeBucket: 'month' as const,
    };
    await repo.addDashboardMetric({
        orgId: 'org',
        dashboardId: 'd/1',
        ...metric,
        height: 4,
    });
    await expect(
        repo.updateDashboardMetric({
            orgId: 'org',
            dashboardId: 'd/1',
            itemId: 'i/1',
            ...metric,
            target: null,
            targetDirection: null,
        })
    ).resolves.toBeUndefined();
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
        kind: 'metric',
        ...metric,
        height: 4,
    });
    expect(fetch.mock.calls[1]![0]).toBe('/dashboards/d%2F1/items/i%2F1');
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body))).toEqual({
        kind: 'metric',
        ...metric,
        target: null,
        targetDirection: null,
    });
});
