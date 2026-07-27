import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { DatasetWorkspace } from './DatasetWorkspace';
import { mockRows, selectedDataset } from './test';

vi.mock('../DatasetGrid', async () => ({
    DatasetGrid: (await import('./test')).DatasetWorkspaceTestGrid,
}));
it('recovers confirmed row feedback through rows, metadata and list reads only', async () => {
    const store = createUiTestRuntime();
    const { dependencies, cache } = store.runtime;
    const rows = vi.fn(async () => ({
        rows: mockRows,
        totalRows: 2,
        offset: 0,
        limit: 200,
    }));
    dependencies.getDatasetRows.execute = rows;
    const metadata = vi.fn(async () => selectedDataset);
    dependencies.getDatasetMetadata.execute = metadata;
    const list = vi.fn(async () => [selectedDataset]);
    dependencies.listDatasets.execute = list;
    const write = vi.fn(async () => [{ ...mockRows[0]!, data: { amount: 42 } }]);
    dependencies.updateDatasetRows.execute = write;
    const user = userEvent.setup();
    render(
        <UiTestProvider store={store}>
            <DatasetWorkspace selectedDataset={selectedDataset} />
        </UiTestProvider>
    );
    await waitFor(() =>
        expect(screen.getByLabelText('first amount')).toHaveTextContent('1')
    );
    vi.spyOn(cache.invalidator, 'invalidate').mockRejectedValueOnce(
        new Error('refresh failed')
    );
    await user.click(screen.getByRole('button', { name: 'Commit amount' }));
    expect(await screen.findByText(/Изменения сохранены/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
    await waitFor(() =>
        expect(screen.queryByText(/Изменения сохранены/)).not.toBeInTheDocument()
    );
    expect(metadata).toHaveBeenCalled();
    expect(list).toHaveBeenCalled();
    expect(rows.mock.calls.length).toBeGreaterThan(1);
    expect(write).toHaveBeenCalledTimes(1);
});
