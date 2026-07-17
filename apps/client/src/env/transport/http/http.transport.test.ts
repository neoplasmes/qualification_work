import { ContractViolationError, HttpError, HttpTransport, NetworkError } from '.';
import { describe, expect, it, vi } from 'vitest';

describe('http transport', () => {
    it.each(['/api', '/api/', 'http://localhost:8080/api/'])(
        'preserves the API prefix for %s',
        async baseUrl => {
            const fetch = vi
                .fn<typeof globalThis.fetch>()
                .mockResolvedValue(Response.json({ ok: true }));
            const transport = new HttpTransport({ baseUrl, fetch });
            const controller = new AbortController();

            await expect(
                transport.request({
                    path: '/auth/me',
                    method: 'GET',
                    responseType: 'json',
                    signal: controller.signal,
                })
            ).resolves.toEqual({ ok: true });
            const [url, requestInit] = fetch.mock.calls[0];
            expect(url).toBe(
                baseUrl.startsWith('http')
                    ? 'http://localhost:8080/api/auth/me'
                    : '/api/auth/me'
            );
            expect(requestInit?.credentials).toBe('include');
            expect(requestInit?.signal).toBe(controller.signal);
            expect(new Headers(requestInit?.headers).has('cookie')).toBe(false);
        }
    );

    it('serializes JSON and accepts empty text success', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(new Response(null, { status: 204 }));
        const transport = new HttpTransport({ baseUrl: '/api', fetch });

        await expect(
            transport.request({
                path: '/auth/login',
                method: 'POST',
                body: { email: 'a@b.dev', password: 'password' },
                responseType: 'text',
            })
        ).resolves.toBe('');
        expect(fetch.mock.calls[0][1]?.body).toBe(
            '{"email":"a@b.dev","password":"password"}'
        );
        expect(new Headers(fetch.mock.calls[0][1]?.headers).get('content-type')).toBe(
            'application/json'
        );
    });

    it.each(['<h1>Unavailable</h1>', '', '{"error":"unavailable"}'])(
        'preserves failed HTTP status before parsing %s',
        async body => {
            const fetch = vi
                .fn<typeof globalThis.fetch>()
                .mockResolvedValue(new Response(body, { status: 503 }));
            const transport = new HttpTransport({ baseUrl: '/api', fetch });

            const error = await transport
                .request({ path: '/orgs', method: 'GET', responseType: 'json' })
                .catch((error: unknown) => error);
            expect(error).toBeInstanceOf(HttpError);
            expect(error).toMatchObject({
                status: 503,
                payload: body.startsWith('{') ? { error: 'unavailable' } : body,
            });
        }
    );

    it('rejects malformed successful JSON as a contract violation', async () => {
        const transport = new HttpTransport({
            baseUrl: '/api',
            fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response('invalid')),
        });
        await expect(
            transport.request({ path: '/auth/me', method: 'GET', responseType: 'json' })
        ).rejects.toBeInstanceOf(ContractViolationError);
    });

    it('preserves abort and classifies fetch failures', async () => {
        const abort = new DOMException('cancelled', 'AbortError');
        const failure = new TypeError('offline');
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockRejectedValueOnce(abort)
            .mockRejectedValueOnce(failure);
        const transport = new HttpTransport({ baseUrl: '/api', fetch });
        const request = {
            path: '/auth/me',
            method: 'GET',
            responseType: 'json' as const,
        };

        await expect(transport.request(request)).rejects.toBe(abort);
        const error = await transport.request(request).catch((error: unknown) => error);
        expect(error).toBeInstanceOf(NetworkError);
        expect(error).toMatchObject({ cause: failure });
    });

    it('forwards cancellation to an outstanding fetch', async () => {
        const fetch: typeof globalThis.fetch = async (_url, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener(
                    'abort',
                    () => reject(init.signal?.reason),
                    { once: true }
                );
            });
        const transport = new HttpTransport({ baseUrl: '/api', fetch });
        const controller = new AbortController();
        const pending = transport.request({
            path: '/auth/me',
            method: 'GET',
            responseType: 'json',
            signal: controller.signal,
        });
        controller.abort();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    });
});
