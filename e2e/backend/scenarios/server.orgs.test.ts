import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

describe('server /api/orgs via gateway', () => {
    it('register creates an initial organization automatically', async () => {
        const user = await registerAndLogin();

        const meResponse = await api('/api/auth/me', { cookie: user.cookie });
        expect(meResponse.status).toBe(200);

        const me = (await meResponse.json()) as {
            isInitializing: boolean;
            organizations: Array<{ id: string; name: string; role: string }>;
        };

        expect(me.isInitializing).toBe(false);
        expect(me.organizations).toEqual([
            { id: user.orgId, name: "E2E's organization", role: 'owner' },
        ]);
    });

    it('create org -> 201 (auth_request forwards X-Internal-Auth)', async () => {
        const user = await registerAndLogin();

        const meResponse = await api('/api/auth/me', { cookie: user.cookie });
        const me = (await meResponse.json()) as { id: string };

        const createResponse = await api('/api/orgs', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                name: `e2e-org-${Date.now()}`,
                displayName: 'E2E Organization',
                ownerId: me.id,
            }),
        });

        expect(createResponse.status).toBe(201);
        const body = (await createResponse.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });
});
