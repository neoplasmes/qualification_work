import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { api, extractSessionCookie } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

describe('auth: registration, login, session lifecycle', () => {
    it('register -> creates user, login returns a session cookie', async () => {
        const email = `auth-e2e-${randomUUID()}@example.com`;
        const password = 'S3curePassword!';

        const register = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name: 'Auth', family: 'Test' }),
        });
        expect([201, 204]).toContain(register.status);

        const login = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        expect([200, 204]).toContain(login.status);

        const cookie = extractSessionCookie(login);
        expect(cookie).toMatch(/^session=/);
    });

    it('/me returns user with auto-created first organization', async () => {
        const user = await registerAndLogin();

        const response = await api('/api/auth/me', { cookie: user.cookie });
        expect(response.status).toBe(200);

        const me = (await response.json()) as {
            id: string;
            email: string;
            isInitializing: boolean;
            organizations: Array<{ id: string; role: string }>;
        };

        expect(me.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(me.email).toBe(user.email);
        expect(me.isInitializing).toBe(false);
        expect(me.organizations.length).toBeGreaterThanOrEqual(1);
        expect(me.organizations.some(o => o.id === user.orgId && o.role === 'owner')).toBe(
            true
        );
    });

    it('/me without cookie -> 401', async () => {
        const response = await api('/api/auth/me');
        expect(response.status).toBe(401);
    });

    it('login with wrong password -> 401 and no session cookie', async () => {
        const user = await registerAndLogin();

        const response = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: 'wrong-password' }),
        });
        expect(response.status).toBe(401);
        expect(extractSessionCookie(response)).toBeNull();
    });

    it('login with unknown email -> 401', async () => {
        const response = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: `nobody-${randomUUID()}@example.com`,
                password: 'whatever-1!',
            }),
        });
        expect(response.status).toBe(401);
    });

    it('logout invalidates the session', async () => {
        const user = await registerAndLogin();

        const logout = await api('/api/auth/logout', {
            method: 'POST',
            cookie: user.cookie,
        });
        expect([200, 204]).toContain(logout.status);

        const me = await api('/api/auth/me', { cookie: user.cookie });
        expect(me.status).toBe(401);
    });

    it('account is temporarily locked after too many failed attempts', async () => {
        const user = await registerAndLogin();

        let sawLockout = false;
        for (let i = 0; i < 7; i++) {
            const response = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: user.email,
                    password: 'definitely-wrong',
                }),
            });
            if (response.status === 423 || response.status === 429) {
                sawLockout = true;

                break;
            }
        }
        expect(sawLockout).toBe(true);
    });
});
