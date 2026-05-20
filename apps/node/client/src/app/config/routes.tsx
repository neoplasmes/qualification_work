import { redirect, type RouteObject } from 'react-router';

import { Layout } from '@/app/ui/Layout';

import { ChartsPage } from '@/pages/Charts';
import { DashboardsPage } from '@/pages/Dashboards';
import { DatasetsPage } from '@/pages/Datasets';
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
                path: '/datasets',
                element: <DatasetsPage />,
            },
            {
                path: '/charts',
                element: <ChartsPage />,
            },
            {
                path: '/dashboards',
                element: <DashboardsPage />,
            },
            {
                path: '/profile',
                element: <ProfilePage />,
            },
        ],
    },
];
