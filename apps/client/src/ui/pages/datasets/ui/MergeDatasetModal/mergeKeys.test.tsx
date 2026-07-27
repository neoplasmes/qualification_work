import { createUploadHarness, metadataFixture } from '@/test/uploadFixtures';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { columns } from '../DatasetWorkspace/test';
import { MergeDatasetModal } from './MergeDatasetModal';

afterEach(() => vi.unstubAllGlobals());
it('sends the selected merge mode and key through the real request', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={{ ...metadataFixture, columns }}
            onSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(
        screen.getByLabelText('Файлы для объединения'),
        new File(['amount,name\n1,A'], 'rows.csv')
    );
    await user.click(screen.getByRole('radio', { name: 'Объединить по ключу' }));
    await user.click(screen.getByRole('button', { name: 'Amount' }));
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const request = fetch.mock.calls.find(([url]) => String(url).includes('/preview'))!;
    const url = new URL(String(request[0]), 'http://localhost');
    expect(url.searchParams.get('mode')).toBe('merge');
    expect(url.searchParams.get('mergeKeys')).toBe('amount');
    view.unmount();
    await runtime.dispose();
});
