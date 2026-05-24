import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

type MeOrg = { id: string; name: string; role: string };
type MeResponse = { id: string; isInitializing: boolean; organizations: MeOrg[] };

const fetchMe = async (cookie: string): Promise<MeResponse> => {
    const response = await api('/api/auth/me', { cookie });
    expect(response.status).toBe(200);

    return (await response.json()) as MeResponse;
};

describe('server /api/orgs', () => {
    it('registration auto-creates an initial owned organization', async () => {
        const user = await registerAndLogin();
        const me = await fetchMe(user.cookie);

        expect(me.isInitializing).toBe(false);
        expect(me.organizations).toEqual([
            { id: user.orgId, name: "E2E's organization", role: 'owner' },
        ]);
    });

    it('create org -> 201 with id, shows up in /me as owner', async () => {
        const user = await registerAndLogin();
        const me = await fetchMe(user.cookie);

        const orgName = `e2e-org-${Date.now()}`;
        const response = await api('/api/orgs', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                name: orgName,
                displayName: 'E2E Organization',
                ownerId: me.id,
            }),
        });
        expect(response.status).toBe(201);
        const { id: newOrgId } = (await response.json()) as { id: string };

        const after = await fetchMe(user.cookie);
        const newOrg = after.organizations.find(o => o.id === newOrgId);
        expect(newOrg).toBeDefined();
        expect(newOrg?.role).toBe('owner');
    });

    it('two newly registered users do not see each other organizations', async () => {
        const a = await registerAndLogin();
        const b = await registerAndLogin();

        const meA = await fetchMe(a.cookie);
        const meB = await fetchMe(b.cookie);

        const orgIdsA = new Set(meA.organizations.map(o => o.id));
        const orgIdsB = new Set(meB.organizations.map(o => o.id));

        expect(orgIdsA.has(b.orgId)).toBe(false);
        expect(orgIdsB.has(a.orgId)).toBe(false);
    });

    it('create org with invalid body -> 400', async () => {
        const user = await registerAndLogin();

        const response = await api('/api/orgs', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ displayName: '' }),
        });
        expect(response.status).toBe(400);
    });
});
