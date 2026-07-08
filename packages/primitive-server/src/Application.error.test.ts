import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Application } from './Application';

let app: Application;

async function startApp(): Promise<string> {
    const server = await app.listen({ port: 0 });

    const address = server.address();

    if (!address || typeof address === 'string') {
        throw new Error('no addr');
    }

    return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
    await app?.close();
    vi.restoreAllMocks();
});

describe('Application error handling', () => {
    it('handles default Errors', async () => {
        app = new Application();

        app.get('/fail', () => {
            throw new Error('error');
        });

        const address = await startApp();

        const res = await fetch(`${address}/fail`);

        expect(res.status).toBe(500);

        await expect(res.json()).resolves.toEqual({ error: 'error' });
    });

    it('handles non-Error values', async () => {
        app = new Application();

        app.get('/fail/string', () => {
            throw 'plain string';
        });

        app.get('/fail/object', () => {
            throw { reason: 'object value' };
        });

        const address = await startApp();

        const stringRes = await fetch(`${address}/fail/string`);
        expect(stringRes.status).toBe(500);
        // "handleUncaughtError" works there
        await expect(stringRes.json()).resolves.toEqual({
            error: 'Internal Server Error',
        });

        const objectRes = await fetch(`${address}/fail/object`);
        expect(objectRes.status).toBe(500);
        await expect(objectRes.json()).resolves.toEqual({
            error: 'Internal Server Error',
        });
    });

    it('handles Promise.reject', async () => {
        app = new Application();

        app.get('/reject/error', async () => {
            await Promise.reject(new Error('async boom'));
        });

        app.get('/reject/string', async () => {
            await Promise.reject('async string');
        });

        const address = await startApp();

        const errorRes = await fetch(`${address}/reject/error`);
        expect(errorRes.status).toBe(500);
        await expect(errorRes.json()).resolves.toEqual({ error: 'async boom' });

        const stringRes = await fetch(`${address}/reject/string`);
        expect(stringRes.status).toBe(500);
        await expect(stringRes.json()).resolves.toEqual({
            error: 'Internal Server Error',
        });
    });

    it('handles different thrown values via onError hook', async () => {
        app = new Application();

        const seen: unknown[] = [];
        const thrownObject = { kind: 'sync-object' };

        app.onError((err, ctx) => {
            seen.push(err);
            ctx.response.status(500).json({ ok: true });
        });

        app.get('/hook/throw', () => {
            throw thrownObject;
        });

        app.get('/hook/reject', async () => {
            await Promise.reject('reject-string');
        });

        const address = await startApp();

        const throwRes = await fetch(`${address}/hook/throw`);
        expect(throwRes.status).toBe(500);
        await expect(throwRes.json()).resolves.toEqual({ ok: true });

        const rejectRes = await fetch(`${address}/hook/reject`);
        expect(rejectRes.status).toBe(500);
        await expect(rejectRes.json()).resolves.toEqual({ ok: true });

        expect(seen).toHaveLength(2);
        expect(seen[0]).toBe(thrownObject);
        expect(seen[1]).toBe('reject-string');
    });

    it('error order test (investigation)', async () => {
        app = new Application();

        app.onError(() => {
            throw new Error('app hook also throws');
        });

        app.get('/fail', () => {
            throw new Error('original');
        });

        app.assignHook('onError', '/fail', () => {
            throw new Error('route hook throws');
        });

        const base = await startApp();
        const res = await fetch(`${base}/fail`);

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({ error: 'original' });
    });
});
