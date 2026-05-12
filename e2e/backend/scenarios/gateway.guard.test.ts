import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

describe('gateway auth guard', () => {
    it('/api/orgs without cookie → 401 (gateway auth_request)', async () => {
        const response = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'no-auth', ownerId: 'whatever' }),
        });

        expect(response.status).toBe(401);
    });

    it('/api/data/datasets without cookie → 401', async () => {
        const response = await api('/api/data/datasets?orgId=x');

        expect(response.status).toBe(401);
    });

    it('/_gateway/health is open without cookie', async () => {
        const response = await api('/_gateway/health');

        expect(response.ok).toBe(true);
    });

    it('session cookie has HttpOnly and Secure flags', async () => {
        const user = await registerAndLogin();
        const setCookie = user.rawSetCookie;

        expect(setCookie).toMatch(/HttpOnly/i);
        expect(setCookie).toMatch(/Secure/i);
    });
});
