import { NetworkError } from '@/env/transport/http';
import { actionFixture } from '@/test/cacheFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ActionsHistory } from '../../../ActionsHistory';

import { ActionRunTab } from './ActionRunTab';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org-1', role: 'owner' } }),
}));
it('recovers an unknown execution through history reads without repeating the write', async () => {
    const store = createUiTestRuntime();
    store.runtime.dependencies.listActions.execute = async () => [actionFixture];
    let committed = false;
    const read = vi.fn(async () =>
        committed
            ? [
                  {
                      ref: 'actionRun:org-1/run' as const,
                      id: 'run',
                      orgId: 'org-1',
                      actionId: actionFixture.id,
                      userId: 'u',
                      parameters: {},
                      changes: [],
                      status: 'success' as const,
                      errorMessage: null,
                      executedAt: '2026-01-01',
                  },
              ]
            : []
    );
    store.runtime.dependencies.listActionRuns.execute = read;
    const execute = vi.fn(async () => {
        committed = true;

        throw new NetworkError('response lost');
    });
    store.runtime.dependencies.executeAction.execute = execute;
    const { container } = render(
        <UiTestProvider store={store}>
            <ActionRunTab
                action={actionFixture}
                editable
                formId="run"
                onRunningChange={vi.fn()}
            />
            <ActionsHistory
                actionNamesById={new Map([[actionFixture.id, 'Saved action']])}
            />
        </UiTestProvider>
    );
    await screen.findByText('Выполнений пока нет.');
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText('The write outcome is unknown')).toBeVisible();
    const history = screen.getByRole('region', { name: 'Журнал действий' });
    await waitFor(() => expect(history).toHaveTextContent('Выполнено'));
    expect(execute).toHaveBeenCalledTimes(1);
    const count = read.mock.calls.length;
    await userEvent
        .setup()
        .click(screen.getAllByRole('button', { name: 'Обновить журнал' })[0]!);
    expect(read.mock.calls.length).toBeGreaterThanOrEqual(count);
    expect(execute).toHaveBeenCalledTimes(1);
});
