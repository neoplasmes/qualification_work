import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/shared/api';

import { manageDashboardsApi } from './manageDashboardsApi';

const createStore = () =>
    configureStore({
        reducer: { [api.reducerPath]: api.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
    });

const mockFetch = () => {
    const nativeRequest = Request;
    class AbsoluteRequest extends nativeRequest {
        constructor(input: RequestInfo | URL, init?: RequestInit) {
            const absoluteInput =
                typeof input === 'string' && input.startsWith('/')
                    ? `http://localhost${input}`
                    : input;

            super(absoluteInput, init);
        }
    }

    const requests: Request[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input);
        requests.push(request.clone());

        if (request.method === 'POST') {
            return new Response(JSON.stringify({ itemId: 'item-1', posY: 0 }), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        return new Response('', { status: 204 });
    });

    vi.stubGlobal('Request', AbsoluteRequest);
    vi.stubGlobal('fetch', fetchMock);

    return { fetchMock, requests };
};

const getPathname = (request: Request) =>
    new URL(request.url, 'http://localhost').pathname;

describe('manageDashboardsApi', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends metric visual and trend config when adding a metric', async () => {
        const store = createStore();
        const { requests } = mockFetch();

        await store.dispatch(
            manageDashboardsApi.endpoints.addDashboardMetric.initiate({
                dashboardId: 'dashboard-1',
                datasetId: 'dataset-1',
                name: 'Revenue',
                expression: 'sum(amount)',
                format: 'currency',
                target: 1000,
                targetDirection: 'higher',
                showTrend: true,
                timeColumn: 'created_at',
                timeBucket: 'month',
            })
        );

        expect(requests[0].method).toBe('POST');
        expect(getPathname(requests[0])).toBe('/api/dashboards/dashboard-1/items');
        await expect(requests[0].json()).resolves.toMatchObject({
            kind: 'metric',
            target: 1000,
            targetDirection: 'higher',
            showTrend: true,
            timeColumn: 'created_at',
            timeBucket: 'month',
        });
    });

    it('sends metric visual and trend config when updating a metric', async () => {
        const store = createStore();
        const { requests } = mockFetch();

        await store.dispatch(
            manageDashboardsApi.endpoints.updateDashboardMetric.initiate({
                dashboardId: 'dashboard-1',
                itemId: 'item-1',
                datasetId: 'dataset-1',
                name: 'Revenue',
                expression: 'sum(amount)',
                format: 'number',
                target: null,
                targetDirection: null,
                showTrend: false,
                timeColumn: null,
                timeBucket: null,
            })
        );

        expect(requests[0].method).toBe('PATCH');
        expect(getPathname(requests[0])).toBe('/api/dashboards/dashboard-1/items/item-1');
        await expect(requests[0].json()).resolves.toMatchObject({
            kind: 'metric',
            target: null,
            targetDirection: null,
            showTrend: false,
            timeColumn: null,
            timeBucket: null,
        });
    });

    it('sends dashboard layout updates to the layout endpoint', async () => {
        const store = createStore();
        const { requests } = mockFetch();

        await store.dispatch(
            manageDashboardsApi.endpoints.updateDashboardLayout.initiate({
                dashboardId: 'dashboard-1',
                layout: [{ itemId: 'item-1', posX: 0, posY: 0, width: 3, height: 2 }],
            })
        );

        expect(requests[0].method).toBe('PATCH');
        expect(getPathname(requests[0])).toBe('/api/dashboards/dashboard-1/items/layout');
        await expect(requests[0].json()).resolves.toEqual({
            layout: [{ itemId: 'item-1', posX: 0, posY: 0, width: 3, height: 2 }],
        });
    });
});
