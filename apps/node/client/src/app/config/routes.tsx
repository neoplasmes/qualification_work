import { redirect, type RouteObject } from 'react-router';

import { Layout } from '@/app/ui/Layout';

import { Entrance, SignIn, SignUp } from '@/pages/Entrance';
import { ProfilePage } from '@/pages/Profile';

import { authApi } from '@/features/authenticate';

import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import type { AppStore } from '../model/store';

/**
 * auth guard
 *
 * @async
 * @param store
 * @param request
 * @returns
 */
const isAuthenticated = async (store: AppStore, request: Request): Promise<boolean> => {
    const getMeQuery = store.dispatch(authApi.endpoints.getMe.initiate());
    request.signal.addEventListener('abort', () => getMeQuery.abort(), { once: true });

    try {
        const result = await getMeQuery;

        return Boolean(result.data);
    } catch {
        return false;
    } finally {
        if (typeof window !== 'undefined') {
            getMeQuery.unsubscribe();
        }
    }
};

const EmptyRoute = () => null;

/**
 * Что вообще происходит:
 * мы хотим использовать rtk query и loader'ы из react-router. При этом мы ещё хотим использовать SSR со стримингом и suspense границами.
 * Все данные, которые были получены на сервере, должны прийти на клиент, чтобы там он синхронизовался с тем, что произошло во время SSR.
 * Соответственно с сервера мы должны отправить PRELOADED_STATE и данные гидрации роутера через __TURBO_STREAM__.
 * Для того, чтобы отправить адекватно PRELOADED_STATE, мы должны создать на сервере наш Store повыполнять всё что надо, в том числе и запросы ртк квери внутри лоадеров,
 * а затем вызвать store.getState() в конце, после того, как там будут все данные выполневшихся лоадеров и прочее, и записать эти данные в <script />
 * Короче именно поэтому такой поганый метод getRoutes получается.
 *
 * На клиенте эта функция уже получит store со всеми данными. Ну и роутер сам данные восстановит
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
                loader: () => redirect('/sign-in'),
            },
            {
                path: '/',
                element: <Entrance />,
                children: [
                    {
                        path: 'sign-in',
                        loader: async ({ request }) => {
                            if (await isAuthenticated(store, request)) {
                                return redirect('/datasets');
                            }

                            return null;
                        },
                        element: <SignIn />,
                    },
                    {
                        path: 'sign-up',
                        loader: async ({ request }) => {
                            if (await isAuthenticated(store, request)) {
                                return redirect('/datasets');
                            }

                            return null;
                        },
                        element: <SignUp />,
                    },
                ],
            },
            {
                element: <WorkspaceLayout />,
                loader: async ({ request }) => {
                    if (!(await isAuthenticated(store, request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                children: [
                    { path: '/actions', element: <EmptyRoute /> },
                    { path: '/actions/view', element: <EmptyRoute /> },
                    { path: '/actions/edit', element: <EmptyRoute /> },
                    { path: '/charts', element: <EmptyRoute /> },
                    { path: '/charts/view', element: <EmptyRoute /> },
                    { path: '/charts/edit', element: <EmptyRoute /> },
                    { path: '/datasets', element: <EmptyRoute /> },
                    { path: '/dashboards', element: <EmptyRoute /> },
                ],
            },
            {
                path: '/profile',
                loader: async ({ request }) => {
                    if (!(await isAuthenticated(store, request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                element: <ProfilePage />,
            },
        ],
    },
];
