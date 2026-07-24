import { createUploadHarness, previewFixture } from '@/test/uploadFixtures';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { UploadDatasetModal } from './UploadDatasetModal';

afterEach(() => vi.unstubAllGlobals());
const files = [new File(['a'], 'sales.csv'), new File(['b'], 'other.xlsx')];

it.each(['rejected', 'uncertain'])(
    'replaces a mixed-drop warning with the %s upload outcome',
    async outcome => {
        const { runtime, fetch, Wrapper } = createUploadHarness();
        let finish!: () => void;
        fetch.mockImplementationOnce(
            () =>
                new Promise((resolve, reject) => {
                    finish = () =>
                        outcome === 'uncertain'
                            ? reject(new TypeError('offline'))
                            : resolve(
                                  Response.json(
                                      { message: 'Rejected upload' },
                                      { status: 400 }
                                  )
                              );
                })
        );
        const user = userEvent.setup();
        const view = render(
            <UploadDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                onUploadSuccess={vi.fn()}
                onClose={vi.fn()}
            />,
            { wrapper: Wrapper }
        );
        fireEvent.drop(screen.getByLabelText('Файлы таблицы'), {
            dataTransfer: { files: [files[0], new File(['invalid'], 'notes.txt')] },
        });
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Выберите файлы CSV или XLSX.'
        );
        const submit = screen.getByRole('button', { name: 'Загрузить таблицу' });
        await user.click(submit);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await act(async () => finish());
        expect(await screen.findByRole('alert')).toHaveTextContent(
            outcome === 'uncertain' ? 'Результат отправки неизвестен' : 'Rejected upload'
        );
        expect(screen.getByRole('alert')).not.toHaveTextContent(
            'Выберите файлы CSV или XLSX.'
        );
        expect(submit).toBeDisabled();
        await user.click(submit);
        expect(
            fetch.mock.calls.filter(([, init]) => init?.method === 'POST')
        ).toHaveLength(1);
        view.unmount();
        await runtime.dispose();
    }
);

it('deduplicates removable files and uploads sequentially then reads acknowledged metadata', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const success = vi.fn();
    const user = userEvent.setup();
    const view = render(
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={success}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files);
    await user.upload(screen.getByLabelText('Файлы таблицы'), files);
    expect(screen.getAllByText('sales.csv')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Загрузить таблицы' }));
    await waitFor(() => expect(success).toHaveBeenCalledWith('uploaded-id'));
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(
        2
    );
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/metadata')).length
    ).toBeGreaterThan(0);
    view.unmount();
    await runtime.dispose();
});

it('keeps acknowledged upload separate from refresh failure and retries only reads', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const success = vi
        .fn()
        .mockRejectedValueOnce(new Error('refresh failed'))
        .mockResolvedValue(undefined);
    const user = userEvent.setup();
    const view = render(
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={success}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files[0]!);
    await user.click(screen.getByRole('button', { name: 'Загрузить таблицу' }));
    expect(await screen.findByText(/Данные сохранены/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Обновить данные' }));
    await waitFor(() => expect(success).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(
        1
    );
    view.unmount();
    await runtime.dispose();
});

it('cleans a late preview using captured org and releases files after its final consumer', async () => {
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
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files);
    await user.click(screen.getByRole('radio', { name: 'Одна таблица' }));
    await user.click(screen.getByRole('button', { name: 'Создать одну таблицу' }));
    view.unmount();
    expect(release).not.toHaveBeenCalled();
    await act(async () => finish(Response.json(previewFixture)));
    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
    ).toHaveLength(0);
    expect(fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe(
        '/api/data/datasets/merge/session-1?orgId=org-1'
    );
    await runtime.dispose();
});

it('surfaces runtime synchronization failure without closing or repeating upload', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    vi.spyOn(runtime.cache.invalidator, 'invalidate').mockRejectedValueOnce(
        new Error('refresh failed')
    );
    const close = vi.fn();
    const user = userEvent.setup();
    const view = render(
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={vi.fn()}
            onClose={close}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files[0]!);
    await user.click(screen.getByRole('button', { name: 'Загрузить таблицу' }));
    expect(await screen.findByText(/Данные сохранены/)).toBeVisible();
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Загрузить таблицу' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Обновить данные' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(
        1
    );
    view.unmount();
    await runtime.dispose();
});

it('keeps a failed batch from uploading its acknowledged first file again', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    const normal = fetch.getMockImplementation()!;
    let uploads = 0;
    fetch.mockImplementation(async (url, init) => {
        if (init?.method === 'POST' && ++uploads === 2) {
            return Response.json({ message: 'Invalid second file' }, { status: 400 });
        }

        return normal(url, init);
    });
    const user = userEvent.setup();
    const view = render(
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files);
    await user.click(screen.getByRole('button', { name: 'Загрузить таблицы' }));
    expect(await screen.findByText(/Invalid second file/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Загрузить таблицы' })).toBeDisabled();
    expect(uploads).toBe(2);
    view.unmount();
    await runtime.dispose();
});

it('keeps the primary commit error when automatic session cleanup fails', async () => {
    const { runtime, fetch, Wrapper } = createUploadHarness();
    fetch.mockImplementation(async (url, init) => {
        if (String(url).includes('/commit')) {
            return Response.json({ message: 'Session expired' }, { status: 404 });
        }
        if (init?.method === 'DELETE') {
            throw new TypeError('cancel failed');
        }

        return Response.json(previewFixture);
    });
    const release = vi.spyOn(runtime.dependencies.uploads, 'release');
    const user = userEvent.setup();
    const view = render(
        <UploadDatasetModal
            org={{ id: 'org-1', name: 'Org' }}
            onUploadSuccess={vi.fn()}
            onClose={vi.fn()}
        />,
        { wrapper: Wrapper }
    );
    await user.upload(screen.getByLabelText('Файлы таблицы'), files);
    await user.click(screen.getByRole('radio', { name: 'Одна таблица' }));
    await user.click(screen.getByRole('button', { name: 'Создать одну таблицу' }));
    expect(await screen.findByText(/Session expired/)).toBeVisible();
    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/cancel failed/)).not.toBeInTheDocument();
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
    ).toHaveLength(1);
    view.unmount();
    await runtime.dispose();
});
