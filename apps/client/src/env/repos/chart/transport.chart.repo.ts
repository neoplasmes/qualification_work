import type { Chart } from '@/core/entities/chart';
import { parseResponse } from '@/env/tools/responseSchema';
import { ContractViolationError, type HttpTransport } from '@/env/transport/http';
import { z } from 'zod';

import type {
    ChartRepo,
    ChartScope,
    CreateChartInput,
    GetChartDataInput,
    ListChartsInput,
    PreviewChartDataInput,
    UpdateChartInput,
} from '@/app/ports/repos/chart';
import type { ReadOptions } from '@/app/ports/repos/readOptions';

import { chartDataSchema, chartSchema } from './chart.schema';

export class HttpChartRepo implements ChartRepo {
    constructor(private readonly transport: HttpTransport) {}

    async listCharts(input: ListChartsInput, options?: ReadOptions): Promise<Chart[]> {
        const rows = parseResponse(
            z.array(chartSchema),
            await this.transport.request({
                path: `/data/charts?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        if (rows.some(row => row.orgId !== input.orgId)) {
            throw new ContractViolationError('Unexpected chart scope');
        }

        return rows.map(row => ({
            ...row,
            ref: `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(row.id)}`,
        }));
    }
    async getChart(input: ChartScope, options?: ReadOptions): Promise<Chart> {
        const row = parseResponse(
            chartSchema,
            await this.transport.request({
                path: `/data/charts/${encodeURIComponent(input.chartId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        if (row.orgId !== input.orgId || row.id !== input.chartId) {
            throw new ContractViolationError('Unexpected chart scope');
        }

        return {
            ...row,
            ref: `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(row.id)}`,
        };
    }
    async getChartData(input: GetChartDataInput, options?: ReadOptions) {
        let suffix = '';
        if (input.filterOverrides?.length) {
            const bytes = new TextEncoder().encode(JSON.stringify(input.filterOverrides));
            const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            const encoded = btoa(binary)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/g, '');
            suffix = `?filterOverrides=${encoded}`;
        }

        return parseResponse(
            chartDataSchema,
            await this.transport.request({
                path: `/data/charts/${encodeURIComponent(input.chartId)}/data${suffix}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );
    }
    async previewChartData(input: PreviewChartDataInput, options?: ReadOptions) {
        const { orgId: _orgId, ...body } = input;

        return parseResponse(
            chartDataSchema,
            await this.transport.request({
                path: '/data/charts/preview',
                method: 'POST',
                body,
                responseType: 'json',
                signal: options?.signal,
            })
        );
    }
    async createChart(input: CreateChartInput) {
        return parseResponse(
            z.object({ id: z.string() }),
            await this.transport.request({
                path: '/data/charts',
                method: 'POST',
                body: input,
                responseType: 'json',
            })
        );
    }
    async updateChart(input: UpdateChartInput): Promise<void> {
        const { chartId, orgId: _orgId, ...body } = input;
        await this.transport.request({
            path: `/data/charts/${encodeURIComponent(chartId)}`,
            method: 'PUT',
            body,
            responseType: 'text',
        });
    }
    async patchChart(input: UpdateChartInput): Promise<void> {
        const { chartId, orgId: _orgId, ...body } = input;
        await this.transport.request({
            path: `/data/charts/${encodeURIComponent(chartId)}`,
            method: 'PATCH',
            body,
            responseType: 'text',
        });
    }
    async deleteChart(input: ChartScope): Promise<void> {
        await this.transport.request({
            path: `/data/charts/${encodeURIComponent(input.chartId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
}
