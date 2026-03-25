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

import { createStore, getRoutes } from '@/app/model';

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
 * turbo-stream - библиотека, которая используется под капотом react-router v7 в FRAMEWORK моде.
 * Я не хочу использовать никакие фреймворки, поэтому я использую Data mode и реимплементирую стратегию передачи промисов на клиент,
 * лежащую в основе фреймворк мода.
 *
 * @param response
 * @param loaderData
 * @param actionData
 * @param errors
 */
async function streamTurboChunks(
    response: FResponse,
    routerContext: HydrationState
): Promise<void> {
    /**
     * turboStream - это ReadableSteam, поток, в который пушатся изначальные данные, а затем доходит по чанку
     * по мере резолва каждого промиса в потокеы
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
     */
    const turboStream = encode(routerContext);
    const reader = turboStream.getReader();

    try {
        let read = await reader.read();

        while (!read.done) {
            console.log(`pushed ${read.value} to the turbostream`);
            // __TURBO_CTRL__ уже есть в window, т.к. мы инжектим его в head
            response.write(
                `<script>window.__TURBO_CTRL__.enqueue('${escapeForScript(read.value)}')</script>`
            );

            read = await reader.read();
        }
    } finally {
        response.write(`<script>window.__TURBO_CTRL__.close()</script>`);
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

    let turboPromise: Promise<void> | null = null;

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

                    turboPromise = streamTurboChunks(response, context);

                    /**
                     * Используем writable чтобы иметь возможность нормально управлять концом потока
                     * onAllReady работает криво
                     */
                    const writable = new Writable({
                        write(chunk: Buffer, encoding, callback) {
                            response.write(chunk, encoding, callback);
                        },
                        async final(callback) {
                            if (turboPromise) {
                                await turboPromise;
                            }

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
