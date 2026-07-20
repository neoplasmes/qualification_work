import { SignIn } from '@/ui/pages/auth/signIn';
import { SignUp } from '@/ui/pages/auth/signUp';
import { ProfilePage } from '@/ui/pages/profile';
import { Layout } from '@/ui/widgets/AppLayout';
import { Entrance } from '@/ui/widgets/EntranceLayout';
import { redirect, type RouteObject } from 'react-router';

import { SessionError } from '@/app/ports/repos/session';

import type { ApplicationRuntime } from '../dependencies';
import { WorkspaceHost } from '../workspaceHost';

/**
 * auth guard
 *
 * @async
 * @param store
 * @param request
 * @returns
 */
const isAuthenticated = async (
    runtime: ApplicationRuntime,
    request: Request
): Promise<boolean> => {
    if (request.signal.aborted) {
        throw new DOMException('Navigation cancelled', 'AbortError');
    }
    if (!runtime.dependencies.session.canRead) {
        return false;
    }
    try {
        await runtime.cache.read(runtime.dependencies.getSession, undefined, {
            signal: request.signal,
        });

        return true;
    } catch (error) {
        if (error instanceof SessionError && error.code === 'expired') {
            return false;
        }

        throw error;
    }
};

const EmptyRoute = () => null;

/**
 * Что вообще происходит:
 * мы хотим использовать normalized cache и loader'ы из react-router. При этом мы ещё хотим использовать SSR со стримингом и suspense границами.
 * Все данные, которые были получены на сервере, должны прийти на клиент, чтобы там он синхронизовался с тем, что произошло во время SSR.
 * Соответственно с сервера мы должны отправить APP_SNAPSHOT и данные гидрации роутера через __TURBO_STREAM__.
 * Для того, чтобы отправить адекватно APP_SNAPSHOT, мы должны создать на сервере наш runtime повыполнять всё что надо, в том числе и нормализованные запросы внутри лоадеров,
 * а затем вызвать createAppSnapshot(runtime.cache, runtime.scopeId) в конце, после того, как там будут все данные выполневшихся лоадеров и прочее, и записать эти данные в <script />
 * Короче именно поэтому такой поганый метод getRoutes получается.
 *
 * На клиенте эта функция уже получит runtime со всеми данными. Ну и роутер сам данные восстановит
 *
 * @param runtime - runtime, который должен быть использован как параметр в каждом loader'e,
 * чтобы иметь возможность вызывать cache.read запросы.
 * @returns
 */
export const getRoutes = (runtime: ApplicationRuntime): RouteObject[] => [
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
                            if (await isAuthenticated(runtime, request)) {
                                return redirect('/datasets');
                            }

                            return null;
                        },
                        element: <SignIn />,
                    },
                    {
                        path: 'sign-up',
                        loader: async ({ request }) => {
                            if (await isAuthenticated(runtime, request)) {
                                return redirect('/datasets');
                            }

                            return null;
                        },
                        element: <SignUp />,
                    },
                ],
            },
            {
                element: <WorkspaceHost />,
                loader: async ({ request }) => {
                    if (!(await isAuthenticated(runtime, request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                children: [
                    { path: '/actions', element: <EmptyRoute /> },
                    { path: '/actions/view', element: <EmptyRoute /> },
                    { path: '/actions/edit', element: <EmptyRoute /> },
                    { path: '/charts', element: <EmptyRoute /> },
                    { path: '/charts/new', element: <EmptyRoute /> },
                    { path: '/charts/view', element: <EmptyRoute /> },
                    { path: '/charts/edit', element: <EmptyRoute /> },
                    { path: '/datasets', element: <EmptyRoute /> },
                    { path: '/dashboards', element: <EmptyRoute /> },
                ],
            },
            {
                path: '/profile',
                loader: async ({ request }) => {
                    if (!(await isAuthenticated(runtime, request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                element: <ProfilePage />,
            },
        ],
    },
];
