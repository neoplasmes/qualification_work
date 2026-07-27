import { ClientRoot } from '@/main/ClientRoot';
import { createDependencies } from '@/main/dependencies';
import { actionsPagePersistence } from '@/ui/pages/actions';
import { dashboardsPagePersistence } from '@/ui/pages/dashboards';
import { datasetsPagePersistence } from '@/ui/pages/datasets';
import { filterApplicationEntitiesPersistence } from '@/ui/widgets/FilterPanel';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavBar } from './NavBar.widget';

const authenticatedSessionStorageKeys = [
    actionsPagePersistence.key,
    'chartsPage_v1',
    datasetsPagePersistence.key,
    dashboardsPagePersistence.key,
    filterApplicationEntitiesPersistence.key,
] as const;

let runtime: ReturnType<typeof createDependencies>;
afterEach(async () => {
    await runtime?.dispose();
    vi.unstubAllGlobals();
});

const renderNavBar = () => {
    runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });

    return render(
        <ClientRoot runtime={runtime}>
            <MemoryRouter initialEntries={['/datasets']}>
                <NavBar />
            </MemoryRouter>
        </ClientRoot>
    );
};

describe('NavBar', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation(async url =>
                String(url).endsWith('/auth/logout')
                    ? new Response(null, { status: 204 })
                    : Response.json({
                          id: 'u',
                          email: 'a@b.com',
                          name: 'A',
                          family: 'B',
                          isInitializing: false,
                          organizations: [],
                      })
            )
        );
    });

    it('clears user-scoped session storage and keeps global UI storage on sign out', async () => {
        const user = userEvent.setup();

        authenticatedSessionStorageKeys.forEach(key => {
            localStorage.setItem(key, JSON.stringify({ value: key }));
        });
        localStorage.setItem('qualification-work.active-org-id', 'org-1');
        localStorage.setItem('panelLayout_v2', JSON.stringify({ sizes: {} }));

        renderNavBar();

        await user.click(screen.getByRole('button', { name: 'Выйти' }));

        await waitFor(() => expect(localStorage.getItem('chartsPage_v1')).toBeNull());
        authenticatedSessionStorageKeys.forEach(key => {
            expect(localStorage.getItem(key)).toBeNull();
        });
        expect(localStorage.getItem('qualification-work.active-org-id')).toBeNull();
        expect(localStorage.getItem('panelLayout_v2')).toBe(
            JSON.stringify({ sizes: {} })
        );
    });
});
