import { HttpError, HttpTransport } from '@/env/transport/http';
import { actionFixture } from '@/test/cacheFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

import { ActionsRightPanel } from '../ActionsRightPanel';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org-1', role: 'owner' } }),
}));

it('retains archive confirmation after deselection and retries only the list read', async () => {
    let archived = false;
    let readFails = true;
    const request = vi
        .spyOn(HttpTransport.prototype, 'request')
        .mockImplementation(async input => {
            if (input.method === 'DELETE') {
                archived = true;

                return undefined;
            }
            if (archived && readFails) {
                throw new HttpError(400);
            }

            return archived ? [] : [actionFixture];
        });
    const store = createUiTestRuntime({
        datasetMetadata: [],
        actions: { rememberedActionId: actionFixture.id, rightPanelTab: 'properties' },
    });
    render(
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/actions/view?id=action-1']}>
                <ActionsRightPanel />
            </MemoryRouter>
        </UiTestProvider>
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Удалить действие' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
    expect(
        await screen.findByText('Выберите действие для просмотра свойств.')
    ).toBeVisible();
    expect(store.ui.actions.getState().rememberedActionId).toBeNull();
    expect(
        screen.getByText('Действие удалено, но обновить список не удалось.')
    ).toBeVisible();

    const callsBeforeRetry = request.mock.calls.length;
    readFails = false;
    await user.click(screen.getByRole('button', { name: 'Обновить список' }));
    await waitFor(() =>
        expect(
            screen.queryByText('Действие удалено, но обновить список не удалось.')
        ).not.toBeInTheDocument()
    );
    expect(screen.getByText('Действие удалено.')).toBeVisible();
    expect(
        request.mock.calls
            .slice(callsBeforeRetry)
            .map(([input]) => [input.method, input.path])
    ).toEqual([['GET', '/data/actions?orgId=org-1']]);
    expect(
        request.mock.calls.filter(([input]) => input.method === 'DELETE')
    ).toHaveLength(1);
});
