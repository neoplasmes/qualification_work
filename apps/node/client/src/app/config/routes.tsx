import { redirect, type RouteObject } from 'react-router';

import { Layout } from '@/app/ui/Layout';

import { Entrance, SignIn, SignUp } from '@/pages/Entrance';
import { ProfilePage } from '@/pages/Profile';

import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import type { AppStore } from '../model/store';

// server-side: SSR_API_BASE_URL is an absolute url (e.g. http://localhost:8080/api)
// client-side: /api is proxied by the gateway
const ssrBase =
    typeof process !== 'undefined' ? (process.env.SSR_API_BASE_URL ?? '/api') : '/api';

const isAuthenticated = async (request: Request): Promise<boolean> => {
    try {
        if (typeof window === 'undefined') {
            const cookie = request.headers.get('cookie') ?? '';
            const res = await fetch(`${ssrBase}/auth/me`, {
                headers: cookie ? { cookie } : {},
            });

            return res.ok;
        }

        const res = await fetch('/api/auth/me', { credentials: 'include' });

        return res.ok;
    } catch {
        return false;
    }
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
                loader: () => redirect('/sign-in'),
            },
            {
                path: '/',
                element: <Entrance />,
                children: [
                    {
                        path: 'sign-in',
                        loader: async ({ request }) => {
                            if (await isAuthenticated(request)) {
                                return redirect('/datasets');
                            }

                            return null;
                        },
                        element: <SignIn />,
                    },
                    {
                        path: 'sign-up',
                        loader: async ({ request }) => {
                            if (await isAuthenticated(request)) {
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
                    if (!(await isAuthenticated(request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                children: [
                    { path: '/actions' },
                    { path: '/charts' },
                    { path: '/datasets' },
                    { path: '/dashboards' },
                ],
            },
            {
                path: '/profile',
                loader: async ({ request }) => {
                    if (!(await isAuthenticated(request))) {
                        return redirect('/sign-in');
                    }

                    return null;
                },
                element: <ProfilePage />,
            },
        ],
    },
];
