import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { Router } from './Router';
import {
    AllHttpMethods,
    AppRequestHookType,
    ErrorHookFn,
    HookFn,
    HttpMethod,
    LifecycleHookFn,
    LifecycleHookType,
    RequestContext,
    RequestHandler,
    RouteHookType,
} from './types';
import type { ListenOptions } from 'node:net';
import { FRequest } from './FRequest';
import { FResponse } from './FResponse';

type LifecycleHooksStore = Record<LifecycleHookType, LifecycleHookFn[]>;

type AppRequestHooksStore = {
    [K in AppRequestHookType]: K extends 'onError' ? ErrorHookFn[] : HookFn[];
};

export class Application {
    readonly router: Router;
    private nodeServer: Server | null;

    private readonly lifecycleHooks: LifecycleHooksStore;

    private readonly appRequestHooks: AppRequestHooksStore;

    constructor() {
        this.router = new Router('');

        this.nodeServer = null;

        this.lifecycleHooks = {
            onCompiled: [],
            onReady: [],
            onClose: [],
        };

        this.appRequestHooks = {
            onRequest: [],
            onResponse: [],
            onError: [],
        };
    }

    addRoute(method: HttpMethod, path: string, handler: RequestHandler): void {
        this.router.addRoute(method, path, handler);
    }

    get(path: string, handler: RequestHandler): void {
        this.router.get(path, handler);
    }

    post(path: string, handler: RequestHandler): void {
        this.router.post(path, handler);
    }

    put(path: string, handler: RequestHandler): void {
        this.router.put(path, handler);
    }

    patch(path: string, handler: RequestHandler): void {
        this.router.patch(path, handler);
    }

    delete(path: string, handler: RequestHandler): void {
        this.router.delete(path, handler);
    }

    assignHook(type: 'onError', path: string, fn: ErrorHookFn): void;
    assignHook(type: Exclude<RouteHookType, 'onError'>, path: string, fn: HookFn): void;
    assignHook(type: RouteHookType, path: string, fn: HookFn | ErrorHookFn): void {
        if (type === 'onError') {
            this.router.assignHook(type, path, fn as ErrorHookFn);
        } else {
            this.router.assignHook(type, path, fn as HookFn);
        }
    }

    mount(prefix: string, router: Router): void {
        this.router.mount(prefix, router);
    }

    onCompiled(fn: LifecycleHookFn): void {
        this.lifecycleHooks.onCompiled.push(fn);
    }

    onReady(fn: LifecycleHookFn): void {
        this.lifecycleHooks.onReady.push(fn);
    }

    onClose(fn: LifecycleHookFn): void {
        this.lifecycleHooks.onClose.push(fn);
    }

    onRequest(fn: HookFn): void {
        this.appRequestHooks.onRequest.push(fn);
    }

    onResponse(fn: HookFn): void {
        this.appRequestHooks.onResponse.push(fn);
    }

    onError(fn: ErrorHookFn): void {
        this.appRequestHooks.onError.push(fn);
    }

    async listen(options: ListenOptions = {}): Promise<Server> {
        const { port = 3000, host = '0.0.0.0' } = options;

        // компилируем все цепочки хуков, т.е. грубо говоря кэшируем их, чтобы не собирать по дереву
        // при каждом запросе
        this.router.compile();

        // Запускаем 'onStart' хук
        await this.runLifecycleHooks('onCompiled');

        // Создаём node http сервер, который будет обрабатывать все наши запросы через handleRequest
        this.nodeServer = createServer((req, res) => {
            this.handleRequest(req, res);
        });

        try {
            await new Promise<void>((resolve, reject) => {
                if (this.nodeServer === null) {
                    reject(new Error('Somehow, server is null'));
                }

                // Обрабатываем ошибку запуска сервера, вызывая reject
                const oneTimeListener = (err: Error) => reject(err);
                this.nodeServer!.once('error', oneTimeListener);

                this.nodeServer!.listen(port, host, () => {
                    this.nodeServer!.removeListener('error', oneTimeListener);
                    resolve();
                });
            });
        } catch (err) {
            throw new Error(`http server has not started.\nReason: ${err}`);
        }

        await this.runLifecycleHooks('onReady');

        this.setupShutdown();

        return this.nodeServer;
    }

    async close(): Promise<void> {
        if (!this.nodeServer) return;

        await this.runLifecycleHooks('onClose');

        await new Promise<void>((resolve, reject) => {
            this.nodeServer!.close(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        this.nodeServer = null;
    }

    private handleRequest(rawReq: IncomingMessage, rawRes: ServerResponse): void {
        const request = new FRequest(rawReq);
        const response = new FResponse(rawRes);

        const ctx: RequestContext = {
            request,
            response,
            rawRequest: rawReq,
            rawResponse: rawRes,
            state: {},
        };

        this.executePipeline(ctx).catch(_err => {
            throw new Error('aaaaaa');
        });
    }

    private async executePipeline(ctx: RequestContext): Promise<void> {
        const { request, response } = ctx;
        const routeErrorHooks: ErrorHookFn[] = [];

        try {
            // onRequest на уровне приложения
            await this.runHookChain(this.appRequestHooks.onRequest, ctx);
            if (response.isSent) return;

            const method = request.method;
            if (!AllHttpMethods.includes(method)) {
                response.status(501).text('not Implemented');

                return;
            }

            const result = this.router.lookup(method, request.pathname);

            if (!result) {
                response.status(404).text('route not found');

                // onResponse на уровне приложения
                await this.runHookChain(this.appRequestHooks.onResponse, ctx);

                return;
            }

            const { handler, params, hooks } = result;

            request.params = params;

            if (hooks) {
                routeErrorHooks.concat(hooks.onError);

                await this.runHookChain(hooks.onRequest, ctx);

                if (response.isSent) {
                    return;
                }

                await this.runHookChain(hooks.preHandler, ctx);

                if (response.isSent) {
                    return;
                }
            }

            await handler(ctx);

            if (hooks) {
                await this.runHookChain(hooks.postHandler, ctx);
            }

            // Глобальный onResponse
            await this.runHookChain(this.appRequestHooks.onResponse, ctx);
        } catch (error: unknown) {
            await this.handleError(error, ctx, routeErrorHooks);
        }
    }

    private async handleError(
        error: unknown,
        ctx: RequestContext,
        routeErrorHooks?: ErrorHookFn[] | null
    ): Promise<void> {
        if (routeErrorHooks) {
            for (let i = 0; i < routeErrorHooks.length; i++) {
                try {
                    await routeErrorHooks[i](error, ctx);
                    if (ctx.response.isSent) {
                        return;
                    }
                } catch {
                    // хук сам выкинул ошибку, поэтому мы продолжаем
                }
            }
        }

        const appErrorHooks = this.appRequestHooks.onError;
        for (let i = 0; i < appErrorHooks.length; i++) {
            try {
                await appErrorHooks[i](error, ctx);
                if (ctx.response.isSent) {
                    return;
                }
            } catch {
                // хук сам выкинул ошибку, поэтому мы продолжаем
            }
        }

        this.handleUncaughtError(error, ctx);
    }

    private handleUncaughtError(error: unknown, ctx: RequestContext): void {
        if (ctx.response.isSent) {
            return;
        }

        // TODO: добавить свои классы ошибок
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        try {
            ctx.response.status(500).json({ error: message });
        } catch {
            // Response stream is broken, nothing we can do
        }
    }

    private async runHookChain(hooks: HookFn[], ctx: RequestContext): Promise<void> {
        for (let i = 0; i < hooks.length; i++) {
            await hooks[i](ctx);
            if (ctx.response.isSent) return;
        }
    }

    private async runLifecycleHooks(type: LifecycleHookType): Promise<void> {
        const hooks = this.lifecycleHooks[type];

        for (let i = 0; i < hooks.length; i++) {
            await hooks[i]();
        }
    }

    private setupShutdown(): void {
        const shutdown = () => {
            this.close().catch(err => {
                console.error('Error during shutdown:', err);
                process.exit(1);
            });
        };

        process.once('SIGTERM', shutdown);
        process.once('SIGINT', shutdown);
    }
}
