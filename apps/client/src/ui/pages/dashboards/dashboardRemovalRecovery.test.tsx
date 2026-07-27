import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import { DashboardsPage } from './Dashboards.page';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: undefined }),
    useActiveOrganization: () => ({ activeOrg: { id: 'o' } }),
}));
vi.mock('./ui/DashboardWidgets', () => ({
    DashboardWidgets: ({
        items,
        onRemoveItem,
    }: {
        items: { id: string }[];
        onRemoveItem: (id: string) => void;
    }) => (
        <div>
            {items.map(item => (
                <button key={item.id} onClick={() => onRemoveItem(item.id)}>
                    Remove {item.id}
                </button>
            ))}
        </div>
    ),
}));
afterEach(() => vi.unstubAllGlobals());

it('keeps confirmed removal feedback and recovers a broken composition without another delete', async () => {
    let removed = false;
    let recover = false;
    const failedReads: string[] = [];
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (url, options) => {
            const path = String(url);
            if (options?.method === 'DELETE') {
                removed = true;

                return new Response(null, { status: 204 });
            }
            if (!path.includes('/dashboards')) {
                return Response.json([]);
            }
            if (removed && !recover) {
                failedReads.push(path);

                return Response.json({ message: 'read failed' }, { status: 500 });
            }
            const board = {
                id: 'd',
                orgId: 'o',
                name: 'Board',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                items: (removed ? ['kept'] : ['i', 'kept']).map((id, index) => ({
                    id,
                    kind: 'chart',
                    chartId: 'c',
                    layout: { posX: index * 6, posY: 0, width: 6, height: 8 },
                })),
            };

            return Response.json(path.includes('?') ? [board] : board);
        });
    vi.stubGlobal('fetch', fetch);
    const store = createUiTestRuntime();
    render(
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/dashboards?id=d']}>
                <DashboardsPage />
            </MemoryRouter>
        </UiTestProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Remove i' }));
    await waitFor(() =>
        expect(store.runtime.cache.tombstones.has('dashboardItem:o/d/i')).toBe(true)
    );
    await waitFor(() => expect(failedReads.some(path => path.includes('?'))).toBe(true));
    expect(
        await screen.findByText(
            'Виджет удалён, но обновление данных не удалось. Обновите данные.'
        )
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Remove kept' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Обновить данные' }));
    await waitFor(() => expect(failedReads.some(path => path.endsWith('/d'))).toBe(true));
    expect(
        screen.getByText(
            'Виджет удалён, но обновление данных не удалось. Обновите данные.'
        )
    ).toBeVisible();
    recover = true;
    fireEvent.click(screen.getByRole('button', { name: 'Обновить данные' }));
    expect(await screen.findByRole('button', { name: 'Remove kept' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Remove i' })).toBeNull();
    expect(
        fetch.mock.calls.filter(([, options]) => options?.method === 'DELETE')
    ).toHaveLength(1);
});
