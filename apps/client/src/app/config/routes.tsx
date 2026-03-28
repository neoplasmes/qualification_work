import { lazy, Suspense } from 'react';
import { data, type RouteObject } from 'react-router';

import { rtkApi } from '@/shared/api/api';

import type { AppStore } from '../model/store';
import { App } from '../ui';
import { Layout } from '../ui/Layout/Layout';

const TestLazyLoading = lazy(
    () => import('../../pages/TestLazyLoading/ui/TestLazyLoading')
);

const PromiseAllTest = lazy(() =>
    import('../../pages/PromiseAllTest/ui/PromiseAllTest').then(m => ({
        default: m.PromiseAllTest,
    }))
);

/**
 * Убогий workaround, без которого на клиенте опять будет показываться fallback каждый раз.
 * Спасибо разработчикам redux, что после initiate возвращается thenable обёртка над промисом.
 *
 * loadings - типо loading, типо загрузка, мы разрешаем разные загрузки, разные fetch'и
 */
const loaderData = async <T extends Record<string, Promise<unknown>>>(
    loadings: T
): Promise<ReturnType<typeof data> | { [K in keyof T]: Awaited<T[K]> }> => {
    /**
     * loaderData: {
     *  'routeID-routeID': {
     *      key: value
     *  } - именно объект key: value сюда попадает. те же самые key в useLoaderData
     * }
     */
    if (typeof window !== 'undefined') {
        const loadNames = Object.keys(loadings) as (keyof T)[];

        const awaitedLoadings = await Promise.all(loadNames.map(name => loadings[name]));

        const result = {} as { [K in keyof T]: Awaited<T[K]> };

        loadNames.forEach((name, index) => {
            result[name] = awaitedLoadings[index];
        });

        return result;
    }

    return data(loadings);
};

/**
 *
 * @param store - redux-store, который должен быть использован как параметр в каждом loader'e,
 * чтобы иметь возможность вызывать rtkQuery запросы.
 * @returns
 */
export const getRoutes = (store: AppStore): RouteObject[] => [
    {
        element: <Layout />,
        children: [
            {
                path: '/',
                Component: App,
                loader: () =>
                    loaderData({
                        testData: store.dispatch(rtkApi.endpoints.getPost.initiate(1)),
                    }),
            },
            {
                path: '/lazy',
                element: (
                    <Suspense fallback={<div>loading...</div>}>
                        <TestLazyLoading />
                    </Suspense>
                ),
            },
            {
                path: '/promise-all',
                element: (
                    <Suspense fallback={<div>loading...</div>}>
                        <PromiseAllTest />
                    </Suspense>
                ),
                loader: () =>
                    loaderData({
                        combined: Promise.all([
                            store.dispatch(rtkApi.endpoints.getPost.initiate(2)),
                            store.dispatch(rtkApi.endpoints.getUser.initiate(1)),
                            store.dispatch(rtkApi.endpoints.getComments.initiate(2)),
                        ]),
                    }),
            },
        ],
    },
];
