import { Writable } from 'node:stream';
import { createAppSnapshot, serializeSnapshot } from '@/env/cache/hydration';
import type { FRequest, FResponse } from 'primitive-server';
import { renderToPipeableStream } from 'react-dom/server';
import {
    createStaticHandler,
    createStaticRouter,
    StaticRouterProvider,
    type HydrationState,
} from 'react-router';
import { encode } from 'turbo-stream';

import { Queue } from '@/shared/lib/queue';

import { ClientRoot } from '../ClientRoot';
import { createDependencies } from '../dependencies';
import { getRoutes } from '../router';

/**
 * без этого ***** не получится нормально передать строку со строками через интернет
 *
 * @param str
 * @returns
 */
function escapeForScript(str: string): string {
    return serializeSnapshot(str).slice(1, -1).replace(/'/g, '\\u0027');
}

function getRequestHeader(request: FRequest, headerName: string): string | undefined {
    const normalizedHeaderName = headerName.toLowerCase();

    for (const [key, values] of Object.entries(request.headersDistinct)) {
        if (key.toLowerCase() === normalizedHeaderName) {
            return values?.[0];
        }
    }

    return undefined;
}

/**
 * turboStream - это ReadableSteam, поток, в который пушатся изначальные данные, а затем доходит по чанку
 * по мере резолва каждого промиса в потокеы
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
 *
 * @param routerContext - контекст роутера
 * @param pendingScripts - очередь скриптов, передавать по ссылке
 * @returns
 */
function collectTurboChunks(
    routerContext: HydrationState,
    pendingScripts: Queue<string>,
    signal: AbortSignal
): Promise<void> {
    const { loaderData, actionData, errors } = routerContext;
    /**
     * Забавно, что если передать весь routerContext, turboStrem будет стримить даже element.
     * То есть он стримит реакт компоненты. Это интересно и возможно может быть использовано
     * где-то когда-то для кастомной реализации RSC???/
     */
    const turboStream = encode({ loaderData, actionData, errors }, { signal });
    const reader = turboStream.getReader();

    /**
     * Создаём по сути асинхронный while loop, который будет пушить турбо-чанк сразу, как только он зарезолвится
     *
     * @returns
     */
    const enqueueDataChunk = async (): Promise<void> => {
        const read = await reader.read();

        if (read.done) {
            return;
        }

        pendingScripts.enqueue(
            `<template data-type="streamed-script">window.__TURBO_CTRL__.enqueue('${escapeForScript(read.value)}');</template>`
        );

        return enqueueDataChunk();
    };

    const cancel = () => {
        void reader.cancel().catch(() => {});
    };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) {
        cancel();
    }

    return enqueueDataChunk().finally(() => {
        signal.removeEventListener('abort', cancel);
        reader.releaseLock();
    });
}

/**
 *
 * @param response
 * @param pendingScripts - очередь скриптов, передавать по ссылке!!
 */
function flushPendingScripts(response: FResponse, pendingScripts: Queue<string>): void {
    while (!pendingScripts.isEmpty()) {
        response.write(pendingScripts.dequeue()!);
    }
}

/**
 * функция, которая кормит
 *
 * @param request
 * @param response
 * @param htmlBefore
 * @param htmlAfter
 * @returns
 */
export async function streamSSR(
    request: FRequest,
    response: FResponse,
    htmlBefore: string,
    htmlAfter: string,
    renderErrorHtml: string
): Promise<unknown> {
    /**
     * Нормальзованные под Web API Request заголовки, чтобы их могли использовать loader'ы в react-router
     */
    const headers: RequestInit['headers'] = {};
    for (const [key, values] of Object.entries(request.headersDistinct)) {
        if (values && values[0]) {
            headers[key] = values[0];
        }
    }

    // cookie forwarding to API requests on SSR server. basically on SSR server there will be no user cookies on
    // outhcoming requests, so they must be passed as extra argument to all requests
    const controller = new AbortController();
    const runtime = createDependencies({
        platform: 'server',
        apiBaseUrl:
            process.env.SSR_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
        requestCookie: getRequestHeader(request, 'cookie'),
        requestSignal: controller.signal,
    });
    let abortReact = () => {};
    let writable: Writable | undefined;
    let finish!: () => void;
    const completed = new Promise<void>(resolve => {
        finish = resolve;
    });
    const disconnect = () => {
        if (!response.writableFinished) {
            controller.abort();
            abortReact();
            writable?.destroy();
        }
        finish();
    };
    request.once('aborted', disconnect);
    response.once('close', disconnect);
    response.once('finish', finish);
    try {
        const routes = getRoutes(runtime);
        const { query, dataRoutes } = createStaticHandler(routes);

        //*-------------------------- Выполнение loader'ов -------------------------------
        /**
         * Согласно докам запускаются параллельно, но await происходит у всех. Тем не менее, если в данных вернуть Промис,
         * можно отложить процесс отправки данных, и надо обернуть в <Await />
         */
        const context = await query(
            new Request(`http://localhost${request.url}`, {
                headers,
                signal: controller.signal,
            })
        );

        if (context instanceof Response) {
            if (context.status >= 300 && context.status < 400) {
                /**
                 * loader может вернуть redirect по какой либо причине
                 */
                const location = context.headers.get('Location');

                if (location) {
                    response.head('location', location).status(context.status).end();
                    await completed;

                    return;
                }
            }

            throw new Error(`Can not handle response ${context.status}`);
        }

        if (context.statusCode === 404) {
            response.status(404).text('Not found');
            await completed;

            return;
        }
        //*---------------------- Loader'ы выполнились успешно --------------------------

        const staticRouter = createStaticRouter(dataRoutes, context);

        await new Promise<void>((resolve, reject) => {
            void completed.then(resolve);
            let didError = false;

            const { pipe, abort } = renderToPipeableStream(
                <ClientRoot runtime={runtime}>
                    <StaticRouterProvider
                        router={staticRouter}
                        context={context}
                        hydrate={false}
                    />
                </ClientRoot>,
                {
                    onShellReady() {
                        response.status(didError ? 500 : 200).head({
                            'content-type': 'text/html; charset=utf-8',
                        });

                        response.write(htmlBefore);

                        const storeData = serializeSnapshot(
                            createAppSnapshot(runtime.cache, runtime.scopeId)
                        );
                        response.write(
                            `<script>window.__APP_SNAPSHOT__=${storeData}</script>`
                        );

                        const pendingScripts = new Queue<string>();
                        const turboPromise = collectTurboChunks(
                            context,
                            pendingScripts,
                            controller.signal
                        ).catch(error => {
                            writable?.destroy(error as Error);

                            throw error;
                        });

                        /**
                         * Используем writable чтобы иметь возможность нормально управлять концом потока
                         * onAllReady работает криво
                         */
                        writable = new Writable({
                            write(chunk: Buffer, encoding, callback) {
                                response.write(chunk, encoding);
                                /**
                                 * Стримим наши скрипты между чанками react, потому что если этого не делать, то может оказаться смешная ситуация:
                                 * <a href="__TURBO_CTRL__ и так далее"></a>
                                 */
                                flushPendingScripts(response, pendingScripts);
                                callback();
                            },
                            final(callback) {
                                void turboPromise.then(
                                    () => {
                                        if (controller.signal.aborted) {
                                            callback();

                                            return;
                                        }
                                        flushPendingScripts(response, pendingScripts);
                                        response.write(
                                            `<template data-type="streamed-script">window.__TURBO_CTRL__.close();</template>`
                                        );
                                        response.write(htmlAfter);
                                        response.end();
                                        callback();
                                    },
                                    error => callback(error as Error)
                                );
                            },
                        });
                        writable.once('error', error => {
                            controller.abort();
                            response.destroy(error);
                            reject(error);
                        });
                        void turboPromise.catch(() => {});

                        pipe(writable);
                    },
                    /**
                     * Стрим даже и не начнётся, можно отсылать 500-ю ошибку
                     *
                     * @param err
                     */
                    onShellError(err: unknown) {
                        response.status(500).contentType('text/html; charset=utf-8');
                        response.end(renderErrorHtml);

                        console.error(err);
                        reject(err);
                    },
                    /**
                     * Не прерывает stream
                     *
                     * @param err
                     */
                    onError(err: unknown) {
                        didError = true;

                        console.error(err);
                    },
                }
            );
            abortReact = abort;
            if (controller.signal.aborted) {
                abort();
            }
        });
    } finally {
        request.removeListener('aborted', disconnect);
        response.removeListener('close', disconnect);
        response.removeListener('finish', finish);
        controller.abort();
        abortReact();
        await runtime.dispose();
    }
}

export type StreamSSRFn = typeof streamSSR;
