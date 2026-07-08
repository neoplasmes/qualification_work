// @vitest-environment node
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { serveStatic } from './serveStatic';

// собираем вызовы response в объект для проверки
function createMockCtx(url: string, headers: Record<string, string> = {}) {
    const calls: {
        statusCode?: number;
        textBody?: string;
        ended?: boolean;
        headers?: Record<string, string | number>;
        streamed?: boolean;
    } = {};

    const response = {
        status(code: number) {
            calls.statusCode = code;

            return response;
        },
        text(body: string) {
            calls.textBody = body;
        },
        end() {
            calls.ended = true;
        },
        head(h: Record<string, string | number>) {
            calls.headers = h;

            return response;
        },
        async stream(readable: NodeJS.ReadableStream) {
            await new Promise<void>((resolve, reject) => {
                const sink = new Writable({
                    write(_c, _e, cb) {
                        cb();
                    },
                });
                readable.pipe(sink);
                sink.on('finish', resolve);
                sink.on('error', reject);
            });
            calls.streamed = true;
        },
    };

    const request = {
        URL: url,
        getHeader(name: string) {
            return headers[name.toLowerCase()];
        },
    };

    // oxlint-disable-next-line typescript/no-explicit-any
    return { ctx: { request, response } as any, calls };
}

describe('serveStatic', () => {
    let tmpDir: string;

    beforeAll(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'serve-static-test-'));
        await writeFile(join(tmpDir, 'app.js'), 'console.log("hi")');
        await writeFile(join(tmpDir, 'style.css'), 'body{}');
        await writeFile(join(tmpDir, 'data.xyz'), 'unknown');
        await mkdir(join(tmpDir, 'subdir'));
    });

    afterAll(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it('отдаёт существующий файл с правильным MIME и стримит', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/app.js');

        await handler(ctx);

        expect(calls.statusCode).toBe(200);
        expect(calls.headers?.['Content-Type']).toBe('application/javascript');
        expect(calls.streamed).toBe(true);
    });

    it('404 для несуществующего файла', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/nope.js');

        await handler(ctx);

        expect(calls.statusCode).toBe(404);
        expect(calls.textBody).toBe('Not Found');
    });

    it('404 для директории', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/subdir');

        await handler(ctx);

        expect(calls.statusCode).toBe(404);
        expect(calls.textBody).toBe('Not Found');
    });

    it('403 при path traversal', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/../../../etc/passwd');

        await handler(ctx);

        expect(calls.statusCode).toBe(403);
        expect(calls.textBody).toBe('Forbidden');
    });

    it('убирает query-параметры из пути', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/app.js?v=123');

        await handler(ctx);

        expect(calls.statusCode).toBe(200);
        expect(calls.streamed).toBe(true);
    });

    it('304 если if-modified-since >= mtime', async () => {
        const fileStat = await stat(join(tmpDir, 'app.js'));
        const future = new Date(fileStat.mtime.getTime() + 10000).toUTCString();

        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/app.js', {
            'if-modified-since': future,
        });

        await handler(ctx);

        expect(calls.statusCode).toBe(304);
        expect(calls.ended).toBe(true);
    });

    it('fallback MIME type для неизвестного расширения', async () => {
        const handler = serveStatic(tmpDir, '/assets');
        const { ctx, calls } = createMockCtx('/assets/data.xyz');

        await handler(ctx);

        expect(calls.statusCode).toBe(200);
        expect(calls.headers?.['Content-Type']).toBe('application/octet-stream');
    });

    it('prefix с trailing slash работает так же', async () => {
        const handler = serveStatic(tmpDir, '/assets/');
        const { ctx, calls } = createMockCtx('/assets/style.css');

        await handler(ctx);

        expect(calls.statusCode).toBe(200);
        expect(calls.headers?.['Content-Type']).toBe('text/css');
    });
});
