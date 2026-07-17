import { HttpSessionRepo } from '.';
import {
    ContractViolationError,
    HttpError,
    HttpTransport,
    NetworkError,
} from '@/env/transport/http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionError } from '@/app/ports/repos/session';

const me = {
    id: 'user/1',
    email: 'user@example.com',
    name: 'First',
    family: 'Last',
    isInitializing: true,
    organizations: [{ id: 'org/1', name: 'Display name', role: 'owner' }],
};

afterEach(() => vi.unstubAllGlobals());

describe('session repository', () => {
    it('maps the flat response and preserves initialization and membership', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(Response.json(me));
        const repo = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const controller = new AbortController();

        await expect(repo.getSession({ signal: controller.signal })).resolves.toEqual({
            user: {
                ref: 'user:user%2F1',
                id: 'user/1',
                email: 'user@example.com',
                name: 'First',
                family: 'Last',
            },
            isInitializing: true,
            organizations: [
                {
                    ref: 'organization:org%2F1',
                    id: 'org/1',
                    name: 'Display name',
                    role: 'owner',
                },
            ],
        });
        expect(fetch.mock.calls[0][0]).toBe('/api/auth/me');
        expect(fetch.mock.calls[0][1]?.signal).toBe(controller.signal);
    });

    it('keeps exact auth request bodies and empty successes', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(
                Response.json({ id: 'new-user', isInitializing: true }, { status: 201 })
            )
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }));
        const repo = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const input = {
            email: 'user@example.com',
            password: 'password',
            name: 'First',
            family: 'Last',
        };

        await expect(repo.register(input)).resolves.toEqual({ id: 'new-user' });
        expect(fetch).toHaveBeenCalledTimes(1);
        await expect(repo.login(input)).resolves.toBeUndefined();
        await expect(repo.logout()).resolves.toBeUndefined();
        expect(
            fetch.mock.calls.map(([url, init]) => [
                url,
                init?.method,
                init?.body,
                init?.credentials,
            ])
        ).toEqual([
            ['/api/auth/register', 'POST', JSON.stringify(input), 'include'],
            [
                '/api/auth/login',
                'POST',
                '{"email":"user@example.com","password":"password"}',
                'include',
            ],
            ['/api/auth/logout', 'POST', undefined, 'include'],
        ]);
    });

    it.each([
        { ...me, organizations: [{ id: 'org', name: 'name', role: 'admin' }] },
        { ...me, isInitializing: undefined },
        { id: 'x' },
    ])('rejects malformed session DTOs', async dto => {
        const repo = new HttpSessionRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json(dto)),
            })
        );
        await expect(repo.getSession()).rejects.toBeInstanceOf(ContractViolationError);
    });

    it('accepts ready users with no organizations', async () => {
        const repo = new HttpSessionRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        Response.json({ ...me, isInitializing: false, organizations: [] })
                    ),
            })
        );
        await expect(repo.getSession()).resolves.toMatchObject({
            isInitializing: false,
            organizations: [],
        });
    });

    it.each([
        [401, 'expired'],
        [400, 'validation'],
    ])('maps session status %s with its cause', async (status, code) => {
        const repo = new HttpSessionRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        Response.json(
                            { error: '', fields: { email: 'invalid' } },
                            { status: Number(status) }
                        )
                    ),
            })
        );
        const error = await repo.getSession().catch((error: unknown) => error);
        expect(error).toBeInstanceOf(SessionError);
        expect(error).toMatchObject({
            code,
            status,
            cause: expect.any(HttpError),
            fields: { email: 'invalid' },
        });
        expect((error as Error).message.length).toBeGreaterThan(0);
    });

    it.each([
        [401, 'invalidCredentials'],
        [423, 'locked'],
    ])('maps login status %s without expiring a session', async (status, code) => {
        const onExpired = vi.fn();
        const repo = new HttpSessionRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(new Response('', { status: Number(status) })),
            })
        );
        repo.attachInterceptors({ onExpired });
        await expect(
            repo.login({ email: 'user@example.com', password: 'password' })
        ).rejects.toMatchObject({ code, status });
        expect(onExpired).not.toHaveBeenCalled();
    });

    it('maps duplicate registration and rejects incomplete receipts', async () => {
        const repo = new HttpSessionRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockResolvedValueOnce(
                        Response.json({ error: 'email already in use' }, { status: 409 })
                    )
                    .mockResolvedValueOnce(Response.json({})),
            })
        );
        const input = {
            email: 'user@example.com',
            password: 'password',
            name: 'First',
            family: 'Last',
        };
        await expect(repo.register(input)).rejects.toMatchObject({
            code: 'emailInUse',
            status: 409,
        });
        await expect(repo.register(input)).rejects.toBeInstanceOf(ContractViolationError);
    });

    it('preserves technical failures for retry and uncertain writes', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockRejectedValueOnce(new TypeError('offline'))
            .mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
        const repo = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        await expect(repo.getSession()).rejects.toBeInstanceOf(NetworkError);
        await expect(repo.logout()).rejects.toBeInstanceOf(HttpError);
    });

    it('isolates SSR cookies and disposes expiration interceptors', async () => {
        vi.stubGlobal('window', undefined);
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockImplementation(async () => new Response('', { status: 401 }));
        const first = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const second = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const onExpired = vi.fn();
        const detach = first.attachInterceptors({
            requestCookie: 'session=first',
            onExpired,
        });
        second.attachInterceptors({
            requestCookie: 'session=second',
            onExpired: vi.fn(),
        });

        await Promise.allSettled([first.getSession(), second.getSession()]);
        expect(
            fetch.mock.calls.map(([, init]) => new Headers(init?.headers).get('cookie'))
        ).toEqual(['session=first', 'session=second']);
        expect(onExpired).toHaveBeenCalledTimes(1);
        detach();
        await first.getSession().catch(() => undefined);
        expect(new Headers(fetch.mock.calls[2][1]?.headers).has('cookie')).toBe(false);
        expect(onExpired).toHaveBeenCalledTimes(1);
    });

    it('omits explicit cookies in browser requests and preserves errors if expiration callback fails', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(new Response('', { status: 401 }));
        const repo = new HttpSessionRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        repo.attachInterceptors({
            requestCookie: 'session=server-only',
            onExpired: () => {
                throw new Error('callback failed');
            },
        });
        await expect(repo.getSession()).rejects.toMatchObject({
            code: 'expired',
            cause: expect.any(HttpError),
        });
        const browserHeaders = new Headers(fetch.mock.calls[0][1]?.headers);
        expect(browserHeaders.has('cookie')).toBe(false);
    });
});
