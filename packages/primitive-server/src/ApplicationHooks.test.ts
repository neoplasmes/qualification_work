import { describe, it, expect, afterEach } from 'vitest';
import { Application } from './Application';
import { Router } from './Router';
import type { RequestContext } from './types';

let app: Application;

async function startApp(): Promise<string> {
    const server = await app.listen({ port: 0 });

    const addr = server.address();

    if (!addr || typeof addr === 'string') {
        throw new Error('no addr');
    }

    return `http://127.0.0.1:${addr.port}`;
}

afterEach(async () => {
    await app?.close();
});

describe('порядок хуков', () => {
    it('app.onRequest, route.onRequest, route.preHandler, handler, route.postHandler, app.onResponse', async () => {
        app = new Application();
        const order: string[] = [];

        app.onRequest(() => {
            order.push('app:onRequest');
        });
        app.onResponse(() => {
            order.push('app:onResponse');
        });

        app.get('/test', (ctx: RequestContext) => {
            order.push('handler');
            ctx.response.text('ok');
        });

        app.assignHook('onRequest', '/test', () => {
            order.push('route:onRequest');
        });
        app.assignHook('preHandler', '/test', () => {
            order.push('route:preHandler');
        });
        app.assignHook('postHandler', '/test', () => {
            order.push('route:postHandler');
        });

        const base = await startApp();
        await fetch(`${base}/test`);

        expect(order).toEqual([
            'app:onRequest',
            'route:onRequest',
            'route:preHandler',
            'handler',
            'route:postHandler',
            'app:onResponse',
        ]);
    });

    it('несколько хуков одного типа выполняются в порядке регистрации', async () => {
        app = new Application();
        const order: string[] = [];

        app.onRequest(() => {
            order.push('app:onRequest:1');
        });
        app.onRequest(() => {
            order.push('app:onRequest:2');
        });
        app.onResponse(() => {
            order.push('app:onResponse');
        });

        app.get('/test', (ctx: RequestContext) => {
            order.push('handler');
            ctx.response.text('ok');
        });

        app.assignHook('preHandler', '/test', () => {
            order.push('route:preHandler:1');
        });
        app.assignHook('preHandler', '/test', () => {
            order.push('route:preHandler:2');
        });

        const base = await startApp();
        await fetch(`${base}/test`);

        expect(order).toEqual([
            'app:onRequest:1',
            'app:onRequest:2',
            'route:preHandler:1',
            'route:preHandler:2',
            'handler',
            'app:onResponse',
        ]);
    });

    it('хуки parent-сегмента идут перед хуками child-сегмента после compile', async () => {
        app = new Application();
        const order: string[] = [];

        const child = new Router();
        child.get('/users', (ctx: RequestContext) => {
            order.push('handler');
            ctx.response.text('ok');
        });
        child.assignHook('onRequest', '/users', () => {
            order.push('child:onRequest');
        });

        app.mount('/api', child);
        app.assignHook('onRequest', '/api', () => {
            order.push('parent:onRequest');
        });

        const base = await startApp();
        await fetch(`${base}/api/users`);

        expect(order).toEqual(['parent:onRequest', 'child:onRequest', 'handler']);
    });

    it('app.onResponse вызывается даже после ошибки в handler', async () => {
        app = new Application();
        const order: string[] = [];

        app.onResponse(() => {
            order.push('app:onResponse');
        });
        app.onError((_err, ctx: RequestContext) => {
            order.push('app:onError');
            ctx.response.status(500).text('error');
        });

        app.get('/fail', () => {
            order.push('handler');
            throw new Error('boom');
        });

        const base = await startApp();
        await fetch(`${base}/fail`);

        expect(order).toEqual(['handler', 'app:onError', 'app:onResponse']);
    });

    it('route onError вызывается перед app onError', async () => {
        app = new Application();
        const order: string[] = [];

        app.onError((_err, ctx: RequestContext) => {
            order.push('app:onError');
            ctx.response.status(500).text('error');
        });

        app.get('/fail', () => {
            throw new Error('boom');
        });

        app.assignHook('onError', '/fail', () => {
            order.push('route:onError');
        });

        const base = await startApp();
        await fetch(`${base}/fail`);

        expect(order).toEqual(['route:onError', 'app:onError']);
    });

    it('lifecycle: onCompiled, onReady, onClose', async () => {
        app = new Application();
        const order: string[] = [];

        app.onCompiled(() => {
            order.push('onCompiled');
        });
        app.onReady(() => {
            order.push('onReady');
        });
        app.onClose(() => {
            order.push('onClose');
        });

        app.get('/', (ctx: RequestContext) => {
            ctx.response.text('ok');
        });

        await startApp();
        expect(order).toEqual(['onCompiled', 'onReady']);

        await app.close();
        expect(order).toEqual(['onCompiled', 'onReady', 'onClose']);
    });
});
