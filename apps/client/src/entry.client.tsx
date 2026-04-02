import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router';
import { decode } from 'turbo-stream';

import { getRoutes } from '@/app/config';
import { createStore } from '@/app/model';

import { api } from '@/shared/api';

import './shared/ui/styles/colors.scss';
import './shared/ui/styles/layout.scss';
import './shared/ui/styles/fonts.scss';
import './index.scss';

const node = document.getElementById('root');

if (!node) {
    throw new Error('FATAL ERROR: ROOT ELEMENT HAS NOT BEEN FOUND');
}

const store = createStore(window.__PRELOADED_STATE__);

/**
 * Изначально здесь сразу будет сериализовано дерево промисов с сервера, не разрешённые сериализованы как $<number>.
 * (в результате encode)
 * После decode отложенные промисы turbo-stream превратит в объекты типа Deferred (внутренний его класс),
 * он будет иметь к ним доступ по ссылке, т.к. сохранит у себя в памяти.
 * Когда приходит новый чанк и мы вызваем enqueue, turbo-stream это видит, т.к. readable stream он тоже сохраняет
 * у себя по ссылке в памяти. Он смотрит id чанка, смотрит данные, с которыми нужно вызвать resolve() своего
 * Deffered объекта, и всё по кайфу делает
 */
const hydrationData = window.__TURBO_STREAM__
    ? ((await decode(window.__TURBO_STREAM__)) as HydrationState)
    : undefined;

console.dir(hydrationData);

/**
 * Данная конструкция работает потому, что после await decode(window.__TURBO_STREAM__),
 * мы уже получаем все деревья с промисами и их pending состояниями (спасибо turbo-stream).
 * Соответственно, мы просто берём и обвешиваем все промисы then колбэками, которые гидрируют кэш в rtk-query
 *
 * Promise.all - разрешаем
 * вложенные промисы - бан
 */
if (hydrationData?.loaderData) {
    /**
     * loaderData: {
     *  'routeID-routeID': {
     *      key: value
     *  }
     * }
     */
    for (const [routeID, routeData] of Object.entries(hydrationData.loaderData)) {
        if (!routeData || typeof routeData !== 'object') {
            continue;
        }

        for (const [key, value] of Object.entries(routeData as Record<string, unknown>)) {
            if (value instanceof Promise) {
                value.then((resolved: unknown) => hydrateRTKFromResolved(resolved));

                continue;
            }

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                for (const nested of Object.values(value as Record<string, unknown>)) {
                    if (nested instanceof Promise) {
                        throw new Error(
                            `nested promises are not allowed. Detected in ${routeID} on "${key}")`
                        );
                    }
                }
            }
        }
    }
}

function hydrateRTKFromResolved(resolved: unknown): void {
    // Попался массив результатов - значит пришёл результат Promise.all
    if (Array.isArray(resolved)) {
        for (const item of resolved) {
            hydrateRTKFromResolved(item);
        }

        return;
    }

    // Обработка непосредственно результатов выполнения RTK query, всё остальное скипнется
    if (
        resolved != null &&
        typeof resolved === 'object' &&
        'endpointName' in resolved &&
        'originalArgs' in resolved &&
        'data' in resolved &&
        (resolved as Record<string, unknown>).status === 'fulfilled'
    ) {
        const { endpointName, originalArgs, data } = resolved as {
            endpointName: string;
            originalArgs: unknown;
            data: unknown;
        };

        store.dispatch(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            api.util.upsertQueryData(endpointName as any, originalArgs, data)
        );
    }
}

const router = createBrowserRouter(getRoutes(store), {
    hydrationData,
});

const _root = hydrateRoot(
    node,
    <Provider store={store}>
        <RouterProvider router={router} />
    </Provider>
);
