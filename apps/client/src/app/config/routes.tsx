import { lazy, Suspense } from 'react';
import { data, type RouteObject } from 'react-router';

import { rtkApi } from '@/shared/api/api';

import type { AppStore } from '../model/store';
import { App } from '../ui';
import { Layout } from '../ui/Layout/Layout';

const TestLazyLoading = lazy(
    () => import('../../pages/TestLazyLoading/ui/TestLazyLoading')
);

/**
 * Что вообще происходит:
 * мы хотим использовать rtk query и loader'ы из react-router. При этом мы ещё хотим использовать SSR со стримингом и suspense границами.
 * Все данные, которые были получены на сервере, должны прийти на клиент, чтобы там он синхронизовался с тем, что произошло во время SSR.
 * Соответственно с сервера мы должны отправить PRELOADED_STATE и __staticRouterHydrationData.
 * Для того, чтобы отправить адекватно PRELOADED_STATE, мы должны создать на сервере наш Store повыполнять всё что надо, в том числе и запросы ртк квери внутри лоадеров,
 * а затем вызвать store.getState() в конце, после того, как там будут все данные выполневшихся лоадеров и прочее, и записать эти данные в <script />
 * Короче именно поэтому такой поганый метод getRoutes получается.
 *
 * На клиенте эта функция уже получит store со всеми данными. Ну и роутер сам данные восстановит
 *
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
                shouldRevalidate: () => false,
                loader: async () => {
                    const testData = new Promise<string>(resolve => {
                        setTimeout(() => {
                            resolve('long data');
                        }, 5000);
                    });

                    await store.dispatch(rtkApi.endpoints.getPost.initiate(1));

                    return data({
                        testData,
                    });
                },
            },
            {
                path: '/lazy',
                element: (
                    <Suspense fallback={<div>loading...</div>}>
                        <TestLazyLoading />
                    </Suspense>
                ),
            },
        ],
    },
];
