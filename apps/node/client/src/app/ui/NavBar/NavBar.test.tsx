import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actionsPagePersistence } from '@/pages/Actions';
import { dashboardsPagePersistence } from '@/pages/Dashboards';
import { datasetsPagePersistence } from '@/pages/Datasets';

import { panelLayoutSlice } from '@/widgets/WorkspaceGrid';

import type * as authenticateModule from '@/features/authenticate';
import { filterApplicationEntitiesPersistence } from '@/features/filterApplicationEntities';

import { NavBar } from './NavBar';

const logoutMock = vi.hoisted(() =>
    vi.fn(() => ({
        unwrap: () => Promise.resolve(),
    }))
);

const setActiveOrgIdMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/authenticate', async importOriginal => {
    const actual = await importOriginal<typeof authenticateModule>();

    return {
        ...actual,
        useGetMeQuery: () => ({ data: { id: 'user-1', organizations: [] } }),
        useActiveOrganization: () => ({
            activeOrg: undefined,
            orgs: [],
            setActiveOrgId: setActiveOrgIdMock,
        }),
        useLogoutMutation: () => [logoutMock, { isLoading: false }],
    };
});

const authenticatedSessionStorageKeys = [
    actionsPagePersistence.key,
    'chartsPage_v1',
    datasetsPagePersistence.key,
    dashboardsPagePersistence.key,
    filterApplicationEntitiesPersistence.key,
] as const;

const renderNavBar = () => {
    const store = configureStore({
        reducer: { panelLayout: panelLayoutSlice.reducer },
    });

    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/datasets']}>
                <NavBar />
            </MemoryRouter>
        </Provider>
    );
};

describe('NavBar', () => {
    beforeEach(() => {
        localStorage.clear();
        logoutMock.mockClear();
        setActiveOrgIdMock.mockClear();
    });

    it('clears user-scoped session storage and keeps global UI storage on sign out', async () => {
        const user = userEvent.setup();

        authenticatedSessionStorageKeys.forEach(key => {
            localStorage.setItem(key, JSON.stringify({ value: key }));
        });
        localStorage.setItem('qualification-work.active-org-id', 'org-1');
        localStorage.setItem('panelLayout_v2', JSON.stringify({ sizes: {} }));

        renderNavBar();

        await user.click(screen.getByRole('button', { name: 'Sign out' }));

        await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
        authenticatedSessionStorageKeys.forEach(key => {
            expect(localStorage.getItem(key)).toBeNull();
        });
        expect(localStorage.getItem('qualification-work.active-org-id')).toBeNull();
        expect(localStorage.getItem('panelLayout_v2')).toBe(
            JSON.stringify({ sizes: {} })
        );
    });
});
