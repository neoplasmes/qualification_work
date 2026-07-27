import { HttpError } from '@/env/transport/http';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ActionsHistory } from './ActionsHistory';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org', role: 'owner' } }),
}));
it('pages history and retries only the failed read', async () => {
    const store = createUiTestRuntime();
    let fail = false;
    const read = vi.fn(async (input: { offset?: number }) => {
        if (fail) {
            throw new HttpError(400);
        }

        return Array.from({ length: input.offset === 50 ? 1 : 50 }, (_, index) => ({
            ref: `actionRun:org/${(input.offset ?? 0) + index}` as const,
            id: String((input.offset ?? 0) + index),
            orgId: 'org',
            actionId: 'a',
            userId: 'u',
            parameters: {},
            changes: [],
            status: 'success' as const,
            errorMessage: null,
            executedAt: '2026-01-01',
        }));
    });
    store.runtime.dependencies.listActionRuns.execute = read;
    const execute = vi.spyOn(store.runtime.dependencies.executeAction, 'execute');
    render(
        <UiTestProvider store={store}>
            <ActionsHistory actionNamesById={new Map([['a', 'Action']])} />
        </UiTestProvider>
    );
    const user = userEvent.setup();
    await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Далее' })).toBeEnabled()
    );
    fail = true;
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
        'Не удалось загрузить журнал.'
    );
    await user.click(screen.getByRole('button', { name: 'Обновить журнал' }));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(3));
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Обновить журнал' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(read).toHaveBeenLastCalledWith(
        { kind: 'org', orgId: 'org', offset: 50, limit: 50 },
        expect.anything()
    );
    expect(screen.getByRole('button', { name: 'Далее' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByText('Страница 1')).toBeInTheDocument();
    expect(execute).not.toHaveBeenCalled();
});
