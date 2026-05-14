import { randomUUID } from 'node:crypto';

import { api, extractSessionCookie } from './api.js';

export type TestUser = {
    email: string;
    password: string;
    cookie: string;
    rawSetCookie: string;
    orgId: string;
};

type MeResponse = {
    id: string;
    email: string;
    isInitializing: boolean;
    organizations: Array<{ id: string; name: string; role: string }>;
};

const waitForInitialOrg = async (cookie: string): Promise<MeResponse> => {
    const deadline = Date.now() + 10_000;
    let lastBody = '';

    while (Date.now() < deadline) {
        const response = await api('/api/auth/me', { cookie });
        lastBody = await response.text();

        if (response.ok) {
            const me = JSON.parse(lastBody) as MeResponse;

            if (!me.isInitializing && me.organizations.length > 0) {
                return me;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error(`initial org was not ready in time: ${lastBody}`);
};

/**
 * Registers a new user, logs him in and returns the session cookie.
 *
 * @export
 * @async
 * @returns {Promise<TestUser>}
 */
export const registerAndLogin = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    const password = 'S3curePassword!';

    const registerResponse = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: 'E2E', family: 'User' }),
    });
    if (registerResponse.status !== 201 && registerResponse.status !== 204) {
        throw new Error(
            `register failed: ${registerResponse.status} ${await registerResponse.text()}`
        );
    }

    const loginResponse = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (!loginResponse.ok && loginResponse.status !== 204) {
        throw new Error(
            `login failed: ${loginResponse.status} ${await loginResponse.text()}`
        );
    }

    const rawSetCookie = loginResponse.headers.get('set-cookie') ?? '';
    const cookie = extractSessionCookie(loginResponse);
    if (!cookie) {
        throw new Error('login: no session cookie in response');
    }

    const me = await waitForInitialOrg(cookie);

    return { email, password, cookie, rawSetCookie, orgId: me.organizations[0].id };
};
