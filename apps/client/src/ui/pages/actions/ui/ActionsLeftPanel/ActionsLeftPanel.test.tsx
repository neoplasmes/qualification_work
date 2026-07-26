import { createUiTestRuntime, UiTestProvider as Provider } from '@/test/uiRuntime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionsLeftPanel } from './ActionsLeftPanel';

let orgRole = 'owner';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: { id: 'user-1' }, isLoading: false }),
    useActiveOrganization: () => ({
        activeOrg: { id: 'org-1', name: 'Test', role: orgRole },
    }),
}));

const makeStore = () => {
    const store = createUiTestRuntime();
    store.runtime.dependencies.listActions.execute = async () => [
        {
            ref: 'action:org-1/action-1',
            id: 'action-1',
            orgId: 'org-1',
            name: 'Receive payment',
            description: null,
            parameters: [],
            effects: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            archivedAt: null,
        },
    ];

    return store;
};

const renderPanel = () =>
    render(
        <Provider store={makeStore()}>
            <MemoryRouter>
                <ActionsLeftPanel />
            </MemoryRouter>
        </Provider>
    );

describe('ActionsLeftPanel', () => {
    beforeEach(() => {
        orgRole = 'owner';
    });

    it('shows actions and opens a new draft', async () => {
        const user = userEvent.setup();
        renderPanel();

        expect(
            await screen.findByRole('button', { name: /Receive payment/ })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Новое действие/i }));

        expect(
            screen.getByRole('button', { name: /Новое действие Черновик.*Не сохранено/i })
        ).toBeInTheDocument();
    });

    it('disables creation for viewer role', () => {
        orgRole = 'viewer';
        renderPanel();

        expect(screen.getByRole('button', { name: /Новое действие/i })).toBeDisabled();
    });
});
