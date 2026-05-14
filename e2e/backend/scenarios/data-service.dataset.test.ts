import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

describe('data-service /api/data via gateway', () => {
    it('dataset list with valid session -> 200/other (not 401)', async () => {
        const user = await registerAndLogin();

        const meResponse = await api('/api/auth/me', { cookie: user.cookie });
        const me = (await meResponse.json()) as { id: string };

        const createOrgResponse = await api('/api/orgs', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                name: `e2e-ds-${Date.now()}`,
                displayName: 'E2E Dataset Org',
                ownerId: me.id,
            }),
        });
        expect(createOrgResponse.status).toBe(201);
        const { id: orgId } = (await createOrgResponse.json()) as { id: string };

        const datasetsResponse = await api(`/api/data/datasets?orgId=${orgId}`, {
            cookie: user.cookie,
        });

        expect(datasetsResponse.status).not.toBe(401);
        expect(datasetsResponse.status).not.toBe(403);
    });
});
