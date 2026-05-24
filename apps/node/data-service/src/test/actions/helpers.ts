import type { OrgRole } from '@qualification-work/microservice-utils/internalAuth';

import { api, dbQuery, setTestIdentity } from '../setup';

export function setIdentity(userId: string, orgId: string, role: OrgRole = 'owner'): void {
    setTestIdentity({
        userId,
        orgs: [{ id: orgId, role }],
    });
}

export async function addUserRole(
    orgId: string,
    userId: string,
    role: OrgRole
): Promise<void> {
    await dbQuery(
        `INSERT INTO orgs.roles (org_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [orgId, userId, role]
    );
}

export function buildInsertAction(orgId: string, datasetId: string) {
    return {
        orgId,
        name: 'Register customer',
        description: 'Adds a customer row',
        parameters: [
            { key: 'id', label: 'ID', type: 'number', required: true },
            { key: 'name', label: 'Name', type: 'string', required: true },
            { key: 'age', label: 'Age', type: 'number', required: true },
            { key: 'city', label: 'City', type: 'string', defaultValue: 'Paris' },
        ],
        effects: [
            {
                kind: 'insertRow',
                datasetId,
                values: {
                    id: { kind: 'parameter', key: 'id' },
                    name: { kind: 'parameter', key: 'name' },
                    age: { kind: 'parameter', key: 'age' },
                    active: { kind: 'literal', value: true },
                    city: { kind: 'parameter', key: 'city' },
                },
            },
        ],
    };
}

export function buildUpdateAction(orgId: string, datasetId: string, maxRows = 1) {
    return {
        orgId,
        name: 'Rename customer',
        description: null,
        parameters: [
            { key: 'id', label: 'ID', type: 'string', required: true },
            { key: 'name', label: 'Name', type: 'string', required: true },
        ],
        effects: [
            {
                kind: 'updateRowsByMatch',
                datasetId,
                match: { columnKey: 'id', parameterKey: 'id' },
                maxRows,
                values: {
                    name: { kind: 'parameter', key: 'name' },
                },
            },
        ],
    };
}

export async function createAction(body: Record<string, unknown>): Promise<string> {
    const res = await api('/api/actions', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (res.status !== 201) {
        throw new Error(`createAction failed with ${res.status}: ${await res.text()}`);
    }

    return ((await res.json()) as { id: string }).id;
}
