import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

describe('server /api/orgs via gateway', () => {
    it('create org -> 201 (auth_request forwards X-Internal-Auth)', async () => {
        const user = await registerAndLogin();

        const meResponse = await api('/api/auth/me', { cookie: user.cookie });
        const me = (await meResponse.json()) as { id: string };

        const createResponse = await api('/api/orgs', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                name: `e2e-org-${Date.now()}`,
                ownerId: me.id,
            }),
        });

        expect(createResponse.status).toBe(201);
        const body = (await createResponse.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });
});
