import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { DatasetsPropertiesPanel } from './DatasetsPropertiesPanel';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org', name: 'Workspace' } }),
}));

it('renames and confirms deletion through scoped commands', async () => {
    const store = createUiTestRuntime({ datasets: { selectedDatasetId: 'ds' } });
    let name = 'Original';
    let removed = false;
    store.runtime.dependencies.listDatasets.execute = async () =>
        removed
            ? []
            : [
                  {
                      dataset: {
                          ref: 'dataset:org/ds',
                          id: 'ds',
                          orgId: 'org',
                          name,
                          sourceType: 'manual',
                          createdAt: '2026-01-01',
                          updatedAt: '2026-01-01',
                      },
                      columns: [],
                      totalRows: 0,
                  },
              ];
    const rename = vi
        .spyOn(store.runtime.dependencies.patchDataset, 'execute')
        .mockImplementation(async input => {
            name = input.name;
        });
    const remove = vi
        .spyOn(store.runtime.dependencies.deleteDataset, 'execute')
        .mockImplementation(async () => {
            removed = true;
        });
    const user = userEvent.setup();
    render(
        <UiTestProvider store={store}>
            <DatasetsPropertiesPanel />
        </UiTestProvider>
    );
    await user.click(await screen.findByRole('button', { name: 'Rename' }));
    await user.clear(screen.getByLabelText('Название таблицы'));
    await user.type(screen.getByLabelText('Название таблицы'), 'Renamed{Enter}');
    await waitFor(() =>
        expect(rename).toHaveBeenCalledWith({
            orgId: 'org',
            datasetId: 'ds',
            name: 'Renamed',
        })
    );
    await screen.findByRole('heading', { name: 'Renamed' });
    await user.click(screen.getByRole('button', { name: 'Удалить таблицу' }));
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
    await waitFor(() =>
        expect(remove).toHaveBeenCalledWith({ orgId: 'org', datasetId: 'ds' })
    );
    await waitFor(() =>
        expect(store.ui.datasets.getState().selectedDatasetId).toBeNull()
    );
});
