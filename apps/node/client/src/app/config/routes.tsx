import { redirect, type RouteObject } from 'react-router';

import { Layout } from '@/app/ui/Layout';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';

import { Entrance, SignIn, SignUp } from '@/pages/Entrance';
import { ProfilePage } from '@/pages/Profile';

import type { AppStore } from '../model/store';

/**
 *
 * @param _store - redux-store, который должен быть использован как параметр в каждом loader'e,
 * чтобы иметь возможность вызывать rtkQuery запросы.
 * @returns
 */
export const getRoutes = (_store: AppStore): RouteObject[] => [
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
                        element: <SignIn />,
                    },
                    {
                        path: 'sign-up',
                        element: <SignUp />,
                    },
                ],
            },
            {
                element: <WorkspaceLayout />,
                children: [
                    { path: '/charts' },
                    { path: '/datasets' },
                    { path: '/dashboards' },
                ],
            },
            {
                path: '/profile',
                element: <ProfilePage />,
            },
        ],
    },
];
