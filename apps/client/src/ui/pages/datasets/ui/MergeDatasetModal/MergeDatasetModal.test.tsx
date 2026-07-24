import {
    createUploadHarness,
    metadataFixture,
    previewFixture,
} from '@/test/uploadFixtures';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { MergeDatasetModal } from './MergeDatasetModal';

afterEach(() => vi.unstubAllGlobals());
const file = new File(['id,name\n1,Alice'], 'rows.csv');

it('previews append, commits once and selects the returned target', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const success = vi.fn();
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={metadataFixture}
            onSuccess={success}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы для объединения'), file);
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    await user.click(await screen.findByRole('button', { name: 'Подтвердить' }));
    await waitFor(() => expect(success).toHaveBeenCalledWith('returned-id'));
    const url = String(
        fetch.mock.calls.find(([url]) => String(url).includes('/preview'))?.[0]
    );
    expect(new URL(url, 'http://localhost').searchParams.get('mode')).toBe('append');
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
    ).toHaveLength(1);
    view.unmount();
    await runtime.dispose();
});

it.each([
    ['network', 'unmount'],
    ['contract', 'unmount'],
    [502, 'close'],
    [502, 'unmount'],
    [504, 'close'],
    [504, 'unmount'],
] as const)(
    'blocks another commit and cancellation after %s uncertainty on %s',
    async (failure, dismissal) => {
        const { runtime, fetch, Wrapper } = createUploadHarness();
        fetch.mockImplementation(async (url, init) => {
            if (String(url).includes('/commit')) {
                if (typeof failure === 'number') {
                    return Response.json(
                        { message: 'Gateway failed' },
                        { status: failure }
                    );
                }
                if (failure === 'contract') {
                    return Response.json({ malformed: true });
                }

                throw new TypeError('offline');
            }
            if (init?.method === 'DELETE') {
                throw new TypeError('cancel offline');
            }

            return Response.json(previewFixture);
        });
        const user = userEvent.setup();
        const view = render(
            <MergeDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                selectedDataset={metadataFixture}
                onSuccess={vi.fn()}
                onClose={vi.fn()}
            />,
            { wrapper: Wrapper }
        );
        await user.upload(screen.getByLabelText('Файлы для объединения'), file);
        await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
        await user.click(await screen.findByRole('button', { name: 'Подтвердить' }));
        expect(await screen.findByText(/Результат отправки неизвестен/)).toBeVisible();
        expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
        await user.click(screen.getByRole('button', { name: 'Назад' }));
        expect(screen.getByText(/Результат отправки неизвестен/)).toBeVisible();
        expect(
            fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
        ).toHaveLength(1);
        if (dismissal === 'close') {
            await user.click(screen.getByRole('button', { name: 'Close modal' }));
            await act(async () => {});
            expect(
                fetch.mock.calls.filter(([, init]) => init?.method === 'DELETE')
            ).toHaveLength(0);
        }
        view.unmount();
        await act(async () => {});
        expect(
            fetch.mock.calls.filter(([, init]) => init?.method === 'DELETE')
        ).toHaveLength(0);
        await runtime.dispose();
    }
);

it('shows an expired preview error with a new preview action', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    fetch.mockImplementation(async url =>
        String(url).includes('/commit')
            ? Response.json({ message: 'Session expired' }, { status: 404 })
            : Response.json(previewFixture)
    );
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={metadataFixture}
            onSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы для объединения'), file);
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    await user.click(await screen.findByRole('button', { name: 'Подтвердить' }));
    expect(await screen.findByText(/Session expired/)).toHaveTextContent(/проверку/);
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('button', { name: 'Проверить данные' })).toBeEnabled();
    view.unmount();
    await runtime.dispose();
});

it('cleans an unmounted pending preview with its captured organization', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    let finish!: (value: Response) => void;
    fetch.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                finish = resolve;
            })
    );
    const release = vi.spyOn(runtime.dependencies.uploads, 'release');
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={metadataFixture}
            onSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы для объединения'), file);
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    view.unmount();
    expect(release).not.toHaveBeenCalled();
    await act(async () => finish(Response.json(previewFixture)));
    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe(
        '/api/data/datasets/merge/session-1?orgId=org-1'
    );
    await runtime.dispose();
});

it('surfaces commit synchronization failure without a second commit', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const close = vi.fn();
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={metadataFixture}
            onSuccess={vi.fn()}
            onClose={close}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы для объединения'), file);
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    const confirm = await screen.findByRole('button', { name: 'Подтвердить' });
    vi.spyOn(runtime.cache.invalidator, 'invalidate').mockRejectedValueOnce(
        new Error('refresh failed')
    );
    await user.click(confirm);
    expect(await screen.findByText(/Данные сохранены/)).toBeVisible();
    expect(close).not.toHaveBeenCalled();
    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Обновить данные' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
    ).toHaveLength(1);
    view.unmount();
    await runtime.dispose();
});

it.each([
    ['confirmed', 'unmount'],
    ['uncertain', 'unmount'],
    [502, 'close'],
    [502, 'unmount'],
    [504, 'close'],
    [504, 'unmount'],
] as const)(
    'does not cancel an in-flight %s commit on %s',
    async (outcome, dismissal) => {
        const { runtime, fetch, Wrapper } = createUploadHarness();
        const normal = fetch.getMockImplementation()!;
        let finish!: (value: Response) => void;
        fetch.mockImplementation((url, init) =>
            String(url).includes('/commit')
                ? new Promise(resolve => {
                      finish = resolve;
                  })
                : normal(url, init)
        );
        const user = userEvent.setup();
        const view = render(
            <MergeDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                selectedDataset={metadataFixture}
                onSuccess={vi.fn()}
                onClose={vi.fn()}
            />,
            { wrapper: Wrapper }
        );
        await user.upload(screen.getByLabelText('Файлы для объединения'), file);
        await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
        await user.click(await screen.findByRole('button', { name: 'Подтвердить' }));
        expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
        if (dismissal === 'close') {
            await user.click(screen.getByRole('button', { name: 'Close modal' }));
        }
        view.unmount();
        expect(
            fetch.mock.calls.filter(([, init]) => init?.method === 'DELETE')
        ).toHaveLength(0);
        await act(async () =>
            finish(
                Response.json(
                    outcome === 'uncertain'
                        ? { malformed: true }
                        : {
                              datasetId: 'dataset-1',
                              insertedRows: 1,
                              updatedRows: 0,
                              skippedDuplicates: 0,
                              copiedRows: 0,
                          },
                    typeof outcome === 'number' ? { status: outcome } : undefined
                )
            )
        );
        expect(
            fetch.mock.calls.filter(([, init]) => init?.method === 'DELETE')
        ).toHaveLength(0);
        expect(
            fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
        ).toHaveLength(1);
        await runtime.dispose();
    }
);

it('keeps real server conflict errors actionable without inventing a preview', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    fetch.mockResolvedValue(
        Response.json({ message: 'Conflicting values in amount' }, { status: 409 })
    );
    const user = userEvent.setup();
    const view = render(
        <MergeDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            selectedDataset={metadataFixture}
            onSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы для объединения'), file);
    await user.click(screen.getByRole('button', { name: 'Проверить данные' }));
    expect(await screen.findByText(/Conflicting values in amount/)).toHaveTextContent(
        /проверку/
    );
    expect(screen.queryByRole('button', { name: 'Подтвердить' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Проверить данные' })).toBeEnabled();
    view.unmount();
    await runtime.dispose();
});
