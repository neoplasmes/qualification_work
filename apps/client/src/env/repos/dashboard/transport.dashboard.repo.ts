import type { Dashboard } from '@/core/entities/dashboard';
import { parseResponse } from '@/env/tools/responseSchema';
import { ContractViolationError, type HttpTransport } from '@/env/transport/http';
import { z } from 'zod';

import type {
    AddChartInput,
    AddMetricInput,
    CreateDashboardInput,
    DashboardItemScope,
    DashboardRepo,
    DashboardScope,
    ListDashboardsInput,
    PreviewMetricInput,
    RenameDashboardInput,
    UpdateLayoutInput,
    UpdateMetricInput,
} from '@/app/ports/repos/dashboard';
import type { ReadOptions } from '@/app/ports/repos/readOptions';

import { dashboardSchema } from './dashboard.schema';

function mapDashboard(row: z.infer<typeof dashboardSchema>, orgId: string): Dashboard {
    if (row.orgId !== orgId) {
        throw new ContractViolationError('Unexpected dashboard scope');
    }
    const address = `${encodeURIComponent(orgId)}/${encodeURIComponent(row.id)}`;

    return {
        ...row,
        ref: `dashboard:${address}`,
        items: row.items.map(item => ({
            ...item,
            ref: `dashboardItem:${address}/${encodeURIComponent(item.id)}`,
        })),
    };
}

export class HttpDashboardRepo implements DashboardRepo {
    constructor(private readonly transport: HttpTransport) {}
    async listDashboards(input: ListDashboardsInput, options?: ReadOptions) {
        const rows = parseResponse(
            z.array(dashboardSchema),
            await this.transport.request({
                path: `/dashboards?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        return rows.map(row => mapDashboard(row, input.orgId));
    }
    async getDashboard(input: DashboardScope, options?: ReadOptions) {
        const row = parseResponse(
            dashboardSchema,
            await this.transport.request({
                path: `/dashboards/${encodeURIComponent(input.dashboardId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );
        if (row.id !== input.dashboardId) {
            throw new ContractViolationError('Unexpected dashboard id');
        }

        return mapDashboard(row, input.orgId);
    }
    async previewDashboardMetric(input: PreviewMetricInput, options?: ReadOptions) {
        const { orgId: _orgId, ...body } = input;

        return parseResponse(
            z.object({ value: z.number().nullable() }),
            await this.transport.request({
                path: '/dashboards/metrics/preview',
                method: 'POST',
                body,
                responseType: 'json',
                signal: options?.signal,
            })
        );
    }
    async createDashboard(input: CreateDashboardInput) {
        return parseResponse(
            z.object({ id: z.string() }),
            await this.transport.request({
                path: '/dashboards',
                method: 'POST',
                body: input,
                responseType: 'json',
            })
        );
    }
    async renameDashboard({
        orgId: _orgId,
        dashboardId,
        ...body
    }: RenameDashboardInput): Promise<void> {
        await this.transport.request({
            path: `/dashboards/${encodeURIComponent(dashboardId)}`,
            method: 'PATCH',
            body,
            responseType: 'text',
        });
    }
    async addDashboardChart({ orgId: _orgId, dashboardId, ...body }: AddChartInput) {
        return parseResponse(
            z.object({ itemId: z.string(), posY: z.number() }),
            await this.transport.request({
                path: `/dashboards/${encodeURIComponent(dashboardId)}/items`,
                method: 'POST',
                body: { kind: 'chart', ...body },
                responseType: 'json',
            })
        );
    }
    async addDashboardMetric({ orgId: _orgId, dashboardId, ...body }: AddMetricInput) {
        return parseResponse(
            z.object({ itemId: z.string(), posY: z.number() }),
            await this.transport.request({
                path: `/dashboards/${encodeURIComponent(dashboardId)}/items`,
                method: 'POST',
                body: { kind: 'metric', ...body },
                responseType: 'json',
            })
        );
    }
    async updateDashboardMetric({
        orgId: _orgId,
        dashboardId,
        itemId,
        ...body
    }: UpdateMetricInput): Promise<void> {
        await this.transport.request({
            path: `/dashboards/${encodeURIComponent(dashboardId)}/items/${encodeURIComponent(itemId)}`,
            method: 'PATCH',
            body: { kind: 'metric', ...body },
            responseType: 'text',
        });
    }
    async updateDashboardLayout({
        orgId: _orgId,
        dashboardId,
        ...body
    }: UpdateLayoutInput): Promise<void> {
        await this.transport.request({
            path: `/dashboards/${encodeURIComponent(dashboardId)}/items/layout`,
            method: 'PATCH',
            body,
            responseType: 'text',
        });
    }
    async removeDashboardItem({
        dashboardId,
        itemId,
    }: DashboardItemScope): Promise<void> {
        await this.transport.request({
            path: `/dashboards/${encodeURIComponent(dashboardId)}/items/${encodeURIComponent(itemId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
    async deleteDashboard({ dashboardId }: DashboardScope): Promise<void> {
        await this.transport.request({
            path: `/dashboards/${encodeURIComponent(dashboardId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
}
