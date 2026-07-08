import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { uploadDataset } from '../datasets/lib';
import {
    api,
    createTestUser,
    createTestUserWithOrg,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { addUserRole, buildInsertAction, createAction, setIdentity } from './lib';

beforeAll(startServer);
afterAll(stopServer);
afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('actions CRUD', () => {
    it('creates, lists, gets, updates and archives an action', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);

        const actionId = await createAction(buildInsertAction(orgId, datasetId));

        const listRes = await api(`/api/actions?orgId=${orgId}`);
        expect(listRes.status).toBe(200);
        const list = (await listRes.json()) as Array<{ id: string; name: string }>;
        expect(list).toEqual([expect.objectContaining({ id: actionId })]);

        const getRes = await api(`/api/actions/${actionId}`);
        expect(getRes.status).toBe(200);
        expect((await getRes.json()) as { name: string }).toMatchObject({
            name: 'Register customer',
        });

        const updated = {
            ...buildInsertAction(orgId, datasetId),
            name: 'Register customer v2',
            description: null,
        };
        const updateRes = await api(`/api/actions/${actionId}`, {
            method: 'PUT',
            body: JSON.stringify(updated),
        });
        expect(updateRes.status).toBe(204);

        const updatedRes = await api(`/api/actions/${actionId}`);
        expect((await updatedRes.json()) as { name: string }).toMatchObject({
            name: 'Register customer v2',
        });

        const patchRes = await api(`/api/actions/${actionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ description: 'Patched description' }),
        });
        expect(patchRes.status).toBe(204);

        const patchedRes = await api(`/api/actions/${actionId}`);
        expect(
            (await patchedRes.json()) as { name: string; description: string }
        ).toMatchObject({
            name: 'Register customer v2',
            description: 'Patched description',
        });

        const deleteRes = await api(`/api/actions/${actionId}`, { method: 'DELETE' });
        expect(deleteRes.status).toBe(204);

        const afterArchiveRes = await api(`/api/actions?orgId=${orgId}`);
        expect(await afterArchiveRes.json()).toEqual([]);
        expect((await api(`/api/actions/${actionId}`)).status).toBe(404);
    });

    it('rejects invalid effect definitions', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);

        const res = await api('/api/actions', {
            method: 'POST',
            body: JSON.stringify({
                ...buildInsertAction(orgId, datasetId),
                effects: [
                    {
                        kind: 'insertRow',
                        datasetId,
                        values: {
                            name: { kind: 'parameter', key: 'missing' },
                        },
                    },
                ],
            }),
        });

        expect(res.status).toBe(400);
    });

    it('allows viewer reads but rejects viewer mutations', async () => {
        const { userId: ownerId, orgId } = await createTestUserWithOrg();
        setIdentity(ownerId, orgId);
        const datasetId = await uploadDataset(orgId);
        const actionId = await createAction(buildInsertAction(orgId, datasetId));

        const viewer = await createTestUser();
        await addUserRole(orgId, viewer.id, 'viewer');
        setIdentity(viewer.id, orgId, 'viewer');

        expect((await api(`/api/actions?orgId=${orgId}`)).status).toBe(200);
        expect((await api(`/api/actions/${actionId}`)).status).toBe(200);

        const createRes = await api('/api/actions', {
            method: 'POST',
            body: JSON.stringify(buildInsertAction(orgId, datasetId)),
        });
        expect(createRes.status).toBe(403);

        const executeRes = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({ parameters: { id: 900, name: 'X', age: 20 } }),
        });
        expect(executeRes.status).toBe(403);
    });

    it('allows editor mutations', async () => {
        const { userId: ownerId, orgId } = await createTestUserWithOrg();
        setIdentity(ownerId, orgId);
        const datasetId = await uploadDataset(orgId);
        const editor = await createTestUser();
        await addUserRole(orgId, editor.id, 'editor');
        setIdentity(editor.id, orgId, 'editor');

        const res = await api('/api/actions', {
            method: 'POST',
            body: JSON.stringify(buildInsertAction(orgId, datasetId)),
        });

        expect(res.status).toBe(201);
    });
});
