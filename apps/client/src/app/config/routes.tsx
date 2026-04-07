import { Suspense } from 'react';
import { data, type RouteObject } from 'react-router';

import { Layout } from '@/app/ui/Layout';

import { DatasetsPage } from '@/pages/Datasets';
import { Entrance, SignIn, SignUp } from '@/pages/Entrance';

import { api } from '@/shared/api';

import type { AppStore } from '../model/store';

// const TestLazyLoading = lazy(
//     () => import('../../pages/TestLazyLoading/ui/TestLazyLoading')
// );

// const PromiseAllTest = lazy(() =>
//     import('../../pages/PromiseAllTest/ui/PromiseAllTest').then(m => ({
//         default: m.PromiseAllTest,
//     }))
// );

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
                index: true,
                element: <div></div>,
                loader: ({ request }) => {
                    const result = store.dispatch(api.endpoints.getPost.initiate(1));

                    request.signal.addEventListener('abort', () => result.abort());

                    return loaderData({ testData: result });
                },
            },
            {
                path: '/lazy',
                element: (
                    <Suspense fallback={<div>loading...</div>}>
                        <div></div>
                    </Suspense>
                ),
            },
            {
                path: '/promise-all',
                element: (
                    <Suspense fallback={<div>loading...</div>}>
                        <div></div>
                    </Suspense>
                ),
                loader: ({ request }) => {
                    const post = store.dispatch(api.endpoints.getPost.initiate(2));
                    const user = store.dispatch(api.endpoints.getUser.initiate(1));
                    const comments = store.dispatch(
                        api.endpoints.getComments.initiate(2)
                    );

                    request.signal.addEventListener('abort', () => {
                        post.abort();
                        user.abort();
                        comments.abort();
                    });

                    return loaderData({ combined: Promise.all([post, user, comments]) });
                },
            },
            {
                path: '/',
                element: <Entrance />,
                children: [
                    {
                        path: 'sign-in',
                        element: <SignIn />,
                    },
                    {
                        path: 'sign-up',
                        element: <SignUp />,
                    },
                ],
            },
            {
                path: '/datasets',
                element: <DatasetsPage />,
            },
        ],
    },
];
