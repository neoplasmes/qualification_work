import { Writable } from 'node:stream';
import type { FRequest, FResponse } from 'primitive-server';
import { renderToPipeableStream } from 'react-dom/server';
import { Provider } from 'react-redux';
import {
    createStaticHandler,
    createStaticRouter,
    StaticRouterProvider,
    type HydrationState,
} from 'react-router';
import { encode } from 'turbo-stream';

import { getRoutes } from '@/app/config';
import { createStore } from '@/app/model';

import { Queue } from '@/shared/lib/queue';

/**
 * без этого ***** не получится нормально передать строку со строками через интернет
 *
 * @param str
 * @returns
 */
function escapeForScript(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
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
    pendingScripts: Queue<string>
): Promise<void> {
    const { loaderData, actionData, errors } = routerContext;
    /**
     * Забавно, что если передать весь routerContext, turboStrem будет стримить даже element.
     * То есть он стримит реакт компоненты. Это интересно и возможно может быть использовано
     * где-то когда-то для кастомной реализации RSC???/
     */
    const turboStream = encode({ loaderData, actionData, errors });
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

    return enqueueDataChunk();
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

    const serverStore = createStore();

    const routes = getRoutes(serverStore);
    const { query, dataRoutes } = createStaticHandler(routes);

    //*-------------------------- Выполнение loader'ов -------------------------------
    /**
     * Согласно докам запускаются параллельно, но await происходит у всех. Тем не менее, если в данных вернуть Промис,
     * можно отложить процесс отправки данных, и надо обернуть в <Await />
     */
    const context = await query(
        new Request(`http://localhost${request.url}`, {
            headers,
        })
    );

    if (context instanceof Response) {
        if (context.status >= 300 && context.status < 400) {
            /**
             * loader может вернуть redirect по какой либо причине
             */
            const location = context.headers.get('Location');

            if (location) {
                return response.head('location', location).status(context.status).end();
            }
        }

        throw new Error(`Can not handle response ${context.status}`);
    }

    if (context.statusCode === 404) {
        return response.status(404).text('Not found');
    }
    //*---------------------- Loader'ы выполнились успешно --------------------------

    const staticRouter = createStaticRouter(dataRoutes, context);

    return new Promise((resolve, reject) => {
        let didError = false;

        const { pipe } = renderToPipeableStream(
            <Provider store={serverStore}>
                <StaticRouterProvider
                    router={staticRouter}
                    context={context}
                    hydrate={false}
                />
            </Provider>,
            {
                onShellReady() {
                    response.status(didError ? 500 : 200).head({
                        'content-type': 'text/html; charset=utf-8',
                    });

                    response.write(htmlBefore);

                    const storeData = JSON.stringify(serverStore.getState());
                    response.write(
                        `<script>window.__PRELOADED_STATE__=${storeData}</script>`
                    );

                    const pendingScripts = new Queue<string>();
                    const turboPromise = collectTurboChunks(context, pendingScripts);

                    /**
                     * Используем writable чтобы иметь возможность нормально управлять концом потока
                     * onAllReady работает криво
                     */
                    const writable = new Writable({
                        write(chunk: Buffer, encoding, callback) {
                            response.write(chunk, encoding);
                            /**
                             * Стримим наши скрипты между чанками react, потому что если этого не делать, то может оказаться смешная ситуация:
                             * <a href="__TURBO_CTRL__ и так далее"></a>
                             */
                            flushPendingScripts(response, pendingScripts);
                            callback();
                        },
                        async final(callback) {
                            await turboPromise;

                            flushPendingScripts(response, pendingScripts);

                            response.write(
                                `<template data-type="streamed-script">window.__TURBO_CTRL__.close();</template>`
                            );

                            response.write(htmlAfter);
                            response.end();

                            callback();
                        },
                    });

                    pipe(writable);
                },
                onAllReady() {
                    resolve(null);
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
    });
}

export type StreamSSRFn = typeof streamSSR;
