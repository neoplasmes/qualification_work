import { vi } from 'vitest';

import type {
    InternalIdentity,
    OrgRole,
} from '@qualification-work/microservice-utils/internalAuth';
import { mockInternalIdentity } from '@qualification-work/microservice-utils/test';

import { api, createTestChart, createTestDataset, createTestUserWithOrg } from '../lib';
import { setTestIdentity } from '../setup';

export type DashboardFixture = {
    userId: string;
    orgId: string;
    datasetId: string;
    chartId: string;
};

export async function bootFixture(): Promise<DashboardFixture> {
    const { userId, orgId } = await createTestUserWithOrg();

    const dataset = await createTestDataset(orgId);
    const chart = await createTestChart(orgId, dataset.id);

    setTestIdentity(
        mockInternalIdentity({
            userId,
            orgs: [{ id: orgId, role: 'owner' }],
        })
    );

    return { userId, orgId, datasetId: dataset.id, chartId: chart.id };
}

export function silenceErrors(): void {
    vi.spyOn(console, 'error').mockImplementation(() => {});
}

export function dashboardIdentity(
    userId: string,
    orgId: string,
    role: OrgRole
): InternalIdentity {
    return mockInternalIdentity({
        userId,
        orgs: [{ id: orgId, role }],
    });
}

export async function createDashboard(
    orgId: string,
    name = 'Dashboard'
): Promise<string> {
    const res = await api('/api/dashboards', {
        method: 'POST',
        body: JSON.stringify({ orgId, name }),
    });

    const body = (await res.json()) as { id: string };

    return body.id;
}

export async function addChartItem(
    dashboardId: string,
    chartId: string
): Promise<string> {
    const res = await api(`/api/dashboards/${dashboardId}/items`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'chart', chartId }),
    });

    const body = (await res.json()) as { itemId: string };

    return body.itemId;
}
