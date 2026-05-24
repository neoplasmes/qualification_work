import { api } from './api.js';
import type { TestUser } from './auth.js';

/**
 * factories for creating server-side resources in e2e tests:
 * each one returns the freshly created entity's id (and sometimes extra metadata)
 * so that scenarios stay declarative and short.
 */

export type DatasetSeed = {
    id: string;
    orgId: string;
};

export type DatasetColumn = {
    id: string;
    key: string;
    displayName: string;
    dataType: 'number' | 'string' | 'date' | 'bool';
    orderIndex: number;
};

export type ChartSeed = {
    id: string;
    orgId: string;
    datasetId: string;
};

export type DashboardSeed = {
    id: string;
    orgId: string;
};

const expectStatus = (response: Response, expected: number, hint: string): void => {
    if (response.status !== expected) {
        throw new Error(
            `[factory] ${hint}: expected ${expected}, got ${response.status}`
        );
    }
};

/**
 * uploads a csv buffer as a fresh dataset, attached to user.orgId by default
 */
export const uploadCsvDataset = async (
    user: TestUser,
    options: {
        csv: string;
        filename?: string;
        orgId?: string;
    }
): Promise<DatasetSeed> => {
    const orgId = options.orgId ?? user.orgId;
    const form = new FormData();
    form.append(
        'file',
        new Blob([options.csv], { type: 'text/csv' }),
        options.filename ?? 'dataset.csv'
    );

    const response = await api(`/api/data/datasets?orgId=${orgId}`, {
        method: 'POST',
        cookie: user.cookie,
        body: form,
    });
    expectStatus(response, 201, 'upload dataset');
    const { id } = (await response.json()) as { id: string };

    return { id, orgId };
};

/**
 * fetches dataset metadata and returns the columns array (used to look up
 * columnIds needed when building chart configs)
 */
export const fetchDatasetColumns = async (
    user: TestUser,
    datasetId: string
): Promise<DatasetColumn[]> => {
    const response = await api(`/api/data/datasets/${datasetId}/metadata`, {
        cookie: user.cookie,
    });
    expectStatus(response, 200, 'fetch dataset metadata');
    const body = (await response.json()) as { columns: DatasetColumn[] };

    return body.columns;
};

/**
 * creates a bar chart by resolving column keys to columnIds via dataset metadata
 */
export const createBarChart = async (
    user: TestUser,
    dataset: DatasetSeed,
    options?: {
        name?: string;
        dimensionKey?: string;
        measureKey?: string;
        aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    }
): Promise<ChartSeed> => {
    const columns = await fetchDatasetColumns(user, dataset.id);
    const dimensionKey = options?.dimensionKey ?? 'category';
    const measureKey = options?.measureKey ?? 'value';
    const dimension = columns.find(c => c.key === dimensionKey);
    const measure = columns.find(c => c.key === measureKey);
    if (!dimension || !measure) {
        throw new Error(
            `[factory] chart: dataset has no columns "${dimensionKey}" / "${measureKey}"`
        );
    }

    const response = await api('/api/data/charts', {
        method: 'POST',
        cookie: user.cookie,
        body: JSON.stringify({
            orgId: dataset.orgId,
            datasetId: dataset.id,
            name: options?.name ?? 'bar chart',
            chartType: 'bar',
            config: {
                kind: 'bar',
                dimension: { columnId: dimension.id },
                measures: [
                    { columnId: measure.id, aggregate: options?.aggregate ?? 'sum' },
                ],
            },
        }),
    });
    expectStatus(response, 201, 'create chart');
    const { id } = (await response.json()) as { id: string };

    return { id, orgId: dataset.orgId, datasetId: dataset.id };
};

export const createDashboard = async (
    user: TestUser,
    options?: { name?: string; orgId?: string }
): Promise<DashboardSeed> => {
    const orgId = options?.orgId ?? user.orgId;
    const response = await api('/api/dashboards', {
        method: 'POST',
        cookie: user.cookie,
        body: JSON.stringify({
            orgId,
            name: options?.name ?? 'e2e dashboard',
        }),
    });
    expectStatus(response, 201, 'create dashboard');
    const { id } = (await response.json()) as { id: string };

    return { id, orgId };
};

/**
 * creates a single-effect insertRow action against the given dataset
 */
export const createInsertRowAction = async (
    user: TestUser,
    dataset: DatasetSeed,
    options: {
        name?: string;
        parameters: Array<{ key: string; type: 'string' | 'number' | 'date' | 'bool' }>;
        values: Record<
            string,
            { kind: 'parameter'; key: string } | { kind: 'literal'; value: unknown }
        >;
    }
): Promise<{ id: string }> => {
    const response = await api('/api/data/actions', {
        method: 'POST',
        cookie: user.cookie,
        body: JSON.stringify({
            orgId: dataset.orgId,
            name: options.name ?? 'insert row action',
            parameters: options.parameters.map(p => ({
                key: p.key,
                label: p.key,
                type: p.type,
                required: true,
            })),
            effects: [
                {
                    kind: 'insertRow',
                    datasetId: dataset.id,
                    values: options.values,
                },
            ],
        }),
    });
    expectStatus(response, 201, 'create action');

    return (await response.json()) as { id: string };
};
