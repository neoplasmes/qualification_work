import { actionFixture } from '@/test/cacheFixtures';
import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { actionToBuilderDraft } from '../../../ActionBuilder';

import { ActionConfigureTab } from './ActionConfigureTab';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org-1', role: 'owner' } }),
}));
const action = {
    ...actionFixture,
    effects: [
        {
            kind: 'insertRow' as const,
            datasetId: 'dataset-1',
            values: {
                a: { kind: 'literal' as const, value: 1, operation: '=' as const },
            },
        },
    ],
};
it('keeps confirmed creation distinct from failed synchronization without resubmitting', async () => {
    const store = createUiTestRuntime({ datasetMetadata: [] });
    store.runtime.dependencies.listActions.execute = async () => [action];
    const gate = deferred<{ id: string }>();
    const create = vi.fn(() => gate.promise);
    store.runtime.dependencies.createAction.execute = create;
    const sync = vi
        .spyOn(store.runtime.cache.invalidator, 'invalidate')
        .mockRejectedValueOnce(new Error('refresh failed'));
    const onCreated = vi.fn();
    const { container } = render(
        <UiTestProvider store={store}>
            <ActionConfigureTab
                draft={actionToBuilderDraft(action)}
                editable
                formId="configure"
                isCreatingAction
                orgId="org-1"
                selectedAction={undefined}
                onActionCreated={onCreated}
                onActionUpdated={vi.fn()}
                onDraftChange={vi.fn()}
                onSavingChange={vi.fn()}
            />
        </UiTestProvider>
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    await act(async () => gate.resolve({ id: action.id }));
    expect(
        await screen.findByText(/Действие сохранено, но обновить экран/)
    ).toBeVisible();
    expect(onCreated).not.toHaveBeenCalled();
    fireEvent.submit(container.querySelector('form')!);
    expect(create).toHaveBeenCalledTimes(1);
    sync.mockRestore();
    await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Обновить данные' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(action.id));
    expect(create).toHaveBeenCalledTimes(1);
});
it('updates the full definition with a void acknowledgement and retains the draft', async () => {
    const store = createUiTestRuntime({ datasetMetadata: [] });
    store.runtime.dependencies.listActions.execute = async () => [action];
    const update = vi.fn(async () => undefined);
    store.runtime.dependencies.updateAction.execute = update;
    const updated = vi.fn();
    const { container } = render(
        <UiTestProvider store={store}>
            <ActionConfigureTab
                draft={actionToBuilderDraft(action)}
                editable
                formId="configure"
                isCreatingAction={false}
                orgId="org-1"
                selectedAction={action}
                onActionCreated={vi.fn()}
                onActionUpdated={updated}
                onDraftChange={vi.fn()}
                onSavingChange={vi.fn()}
            />
        </UiTestProvider>
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(updated).toHaveBeenCalledWith(action.id));
    expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
            actionId: action.id,
            orgId: action.orgId,
            name: action.name,
            effects: action.effects,
        })
    );
});

it('does not navigate from a retired editor after a delayed creation', async () => {
    const store = createUiTestRuntime({ datasetMetadata: [] });
    store.runtime.dependencies.listActions.execute = async () => [action];
    const gate = deferred<{ id: string }>();
    const create = vi.fn(() => gate.promise);
    store.runtime.dependencies.createAction.execute = create;
    const onCreated = vi.fn();
    const { container, unmount } = render(
        <UiTestProvider store={store}>
            <ActionConfigureTab
                draft={actionToBuilderDraft(action)}
                editable
                formId="configure"
                isCreatingAction
                orgId="org-1"
                selectedAction={undefined}
                onActionCreated={onCreated}
                onActionUpdated={vi.fn()}
                onDraftChange={vi.fn()}
                onSavingChange={vi.fn()}
            />
        </UiTestProvider>
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => gate.resolve({ id: action.id }));
    expect(onCreated).not.toHaveBeenCalled();
});
