import type { Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { Router } from './Router';
import type {
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

type AppRequestHooksStore<T extends Record<string, unknown>> = {
    [K in AppRequestHookType]: K extends 'onError' ? ErrorHookFn<T>[] : HookFn<T>[];
};

function banWrite(res: ServerResponse): () => void {
    const original = res.write;

    res.write = (() => true) as typeof res.write;

    return () => {
        res.write = original;
    };
}

/**
 * Примитивный фреймворк поверх node:http, вдохновлённый fastify, и обладающий следующими функциями:
 * radix tree routing - только на уровне сгементов пути.
 * hook - хуки на любой этап запроса на любом уровне вложенности и с привязкой к конкретному методу без перебора всех подряд как в Express
 * hooks state - состояние, передающееся между хуками в рамках одного запроса
 *
 * @export
 * @class Application
 * @typedef {Application}
 * @template [T=unknown] hooks state type
 */
export class Application<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly router: Router<T>;
    private nodeServer: Server | null;

    private readonly lifecycleHooks: LifecycleHooksStore;

    private readonly appRequestHooks: AppRequestHooksStore<T>;

    private activeRequests = 0;
    private onDrained: (() => void) | null = null;

    constructor() {
        this.router = new Router<T>('');

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

    addRoute(method: HttpMethod, path: string, handler: RequestHandler<T>): void {
        this.router.addRoute(method, path, handler);
    }

    get(path: string, handler: RequestHandler<T>): void {
        this.router.get(path, handler);
    }

    post(path: string, handler: RequestHandler<T>): void {
        this.router.post(path, handler);
    }

    put(path: string, handler: RequestHandler<T>): void {
        this.router.put(path, handler);
    }

    patch(path: string, handler: RequestHandler<T>): void {
        this.router.patch(path, handler);
    }

    delete(path: string, handler: RequestHandler<T>): void {
        this.router.delete(path, handler);
    }

    assignHook(type: 'onError', path: string, fn: ErrorHookFn<T>): void;
    assignHook(
        type: Exclude<RouteHookType, 'onError'>,
        path: string,
        fn: HookFn<T>
    ): void;
    assignHook(type: RouteHookType, path: string, fn: HookFn<T> | ErrorHookFn<T>): void {
        if (type === 'onError') {
            this.router.assignHook(type, path, fn as ErrorHookFn<T>);
        } else {
            this.router.assignHook(type, path, fn as HookFn<T>);
        }
    }

    mount(prefix: string, router: Router<T>): void {
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

    onRequest(fn: HookFn<T>): void {
        this.appRequestHooks.onRequest.push(fn);
    }

    onResponse(fn: HookFn<T>): void {
        this.appRequestHooks.onResponse.push(fn);
    }

    onError(fn: ErrorHookFn<T>): void {
        this.appRequestHooks.onError.push(fn);
    }

    async listen(options: ListenOptions = {}): Promise<Server> {
        options.port = options.port ?? 3000;
        options.host = options.host ?? '0.0.0.0';

        // компилируем все цепочки хуков, т.е. грубо говоря кэшируем их, чтобы не собирать по дереву
        // при каждом запросе
        this.router.compile();

        // Запускаем 'onStart' хук
        await this.runLifecycleHooks('onCompiled');

        // Создаём node http сервер, который будет обрабатывать все наши запросы через handleRequest
        this.nodeServer = createServer(
            { IncomingMessage: FRequest, ServerResponse: FResponse },
            (req, res) => {
                this.handleRequest(req, res);
            }
        );

        try {
            await new Promise<void>((resolve, reject) => {
                if (this.nodeServer === null) {
                    reject(new Error('Somehow, server is null'));
                }

                // Обрабатываем ошибку запуска сервера, вызывая reject
                const oneTimeListener = (err: Error) => reject(err);
                this.nodeServer!.once('error', oneTimeListener);

                this.nodeServer!.listen(options, () => {
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

    async close(shutdownTimeout = 10_000): Promise<void> {
        if (!this.nodeServer) {
            return;
        }

        await this.runLifecycleHooks('onClose');

        // Перестаём принимать новые соединения
        await new Promise<void>((resolve, reject) => {
            this.nodeServer!.close(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Ждём завершения активных запросов с таймаутом
        if (this.activeRequests > 0) {
            await Promise.race([
                new Promise<void>(resolve => {
                    this.onDrained = resolve;
                }),
                new Promise<void>(resolve => setTimeout(resolve, shutdownTimeout)),
            ]);

            this.onDrained = null;
        }

        this.nodeServer = null;
    }

    private handleRequest(request: FRequest, response: FResponse): void {
        const ctx: RequestContext<T> = {
            request,
            response,
            state: {} as T,
        };

        this.activeRequests++;

        this.executePipeline(ctx)
            .catch(_err => {
                throw new Error('aaaaaa');
            })
            .finally(() => {
                this.activeRequests--;

                if (this.activeRequests === 0 && this.onDrained) {
                    this.onDrained();
                }
            });
    }

    private async executePipeline(ctx: RequestContext<T>): Promise<void> {
        const { request, response } = ctx;
        let routeErrorHooks: ErrorHookFn<T>[] | null = null;

        try {
            // onRequest на уровне приложения
            await this.runHookChain(this.appRequestHooks.onRequest, ctx);
            if (response.sent) {
                return;
            }

            const method = request.method as HttpMethod | undefined;
            const result = this.router.lookup(request.pathname);

            if (!method || !result.found || !result.handlers) {
                response.status(404).text('Not Found');
                return;
            }

            const { handlers, params, hooks } = result;

            if (method === 'OPTIONS' && !handlers.OPTIONS) {
                response.head('allow', handlers.getAllowedMethods()).status(204).end();
                return;
            }

            let handler = handlers.get(method);
            const isImplicitHead = method === 'HEAD' && !handler && handlers.GET !== null;

            if (isImplicitHead) {
                handler = handlers.GET;
            }

            if (!handler) {
                response.status(405).text('Method Not Allowed');
                return;
            }

            request.params = params;

            if (hooks) {
                routeErrorHooks = hooks.onError;

                await this.runHookChain(hooks.onRequest, ctx);
                if (response.sent) {
                    return;
                }

                await this.runHookChain(hooks.preHandler, ctx);
                if (response.sent) {
                    return;
                }
            }

            if (isImplicitHead) {
                const allowWrite = banWrite(ctx.response);

                await handler(ctx);

                allowWrite();

                if (!response.sent) {
                    response.end();
                }
            } else {
                await handler(ctx);
            }

            if (hooks) {
                await this.runHookChain(hooks.postHandler, ctx);
            }
        } catch (error: unknown) {
            await this.handleError(error, ctx, routeErrorHooks);
        } finally {
            // onResponse вызывается всегда, даже после ошибки
            await this.runHookChain(this.appRequestHooks.onResponse, ctx);
        }
    }

    private async handleError(
        error: unknown,
        ctx: RequestContext<T>,
        routeErrorHooks?: ErrorHookFn<T>[] | null
    ): Promise<void> {
        if (routeErrorHooks) {
            for (let i = 0; i < routeErrorHooks.length; i++) {
                try {
                    await routeErrorHooks[i](error, ctx);
                    if (ctx.response.sent) {
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
                if (ctx.response.sent) {
                    return;
                }
            } catch {
                // хук сам выкинул ошибку, поэтому мы продолжаем
            }
        }

        this.handleUncaughtError(error, ctx);
    }

    private handleUncaughtError(error: unknown, ctx: RequestContext<T>): void {
        if (ctx.response.sent) {
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

    private async runHookChain(
        hooks: HookFn<T>[],
        ctx: RequestContext<T>
    ): Promise<void> {
        for (let i = 0; i < hooks.length; i++) {
            await hooks[i](ctx);
            if (ctx.response.sent) {
                return;
            }
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
