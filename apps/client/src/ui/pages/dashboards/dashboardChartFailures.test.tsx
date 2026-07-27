import './test';

import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import { DashboardsPage } from './Dashboards.page';
import { dashboardsPageInitialState } from './model';
import { dashboard, datasetMetadataFixtures, mocks } from './test';

beforeEach(() => {
    vi.clearAllMocks();
    dashboard.items = [];
    mocks.addDashboardChart.mockReset().mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({ itemId: 'added', posY: 0 }),
    });
    render(
        <UiTestProvider
            store={createUiTestRuntime({
                datasetMetadata: datasetMetadataFixtures,
                dashboards: {
                    ...dashboardsPageInitialState,
                    rememberedDashboardId: 'dashboard-1',
                },
            })}
        >
            <MemoryRouter initialEntries={['/dashboards?id=dashboard-1']}>
                <DashboardsPage />
            </MemoryRouter>
        </UiTestProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'График' }));
});

it('shows a rejected chart add inside the open dialog', async () => {
    mocks.addDashboardChart.mockReturnValueOnce({
        unwrap: vi.fn().mockRejectedValue(new Error('failed')),
    });
    const dialog = screen.getByRole('dialog', { name: 'Add chart' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Revenue/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to dashboard' }));
    await waitFor(() =>
        expect(within(dialog).getByText('Unable to add selected charts.')).toBeVisible()
    );
    expect(
        within(dialog).getByRole('button', { name: 'Add to dashboard' })
    ).toBeEnabled();
});

it('closes a confirmed add with refresh feedback and no repeated write', async () => {
    mocks.addDashboardChart.mockReturnValueOnce({
        unwrap: vi.fn().mockResolvedValue({ itemId: 'added', posY: 0 }),
        syncError: new Error('refresh failed'),
    });
    const dialog = screen.getByRole('dialog', { name: 'Add chart' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Revenue/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to dashboard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
        screen.getByText(/График добавлен, но обновление данных не удалось/)
    ).toBeVisible();
    expect(mocks.addDashboardChart).toHaveBeenCalledTimes(1);
});

it('retries only the unconfirmed chart after a partial add', async () => {
    mocks.addDashboardChart
        .mockReturnValueOnce({
            unwrap: vi.fn().mockResolvedValue({ itemId: 'first', posY: 0 }),
        })
        .mockReturnValueOnce({ unwrap: vi.fn().mockRejectedValue(new Error('failed')) });
    const dialog = screen.getByRole('dialog', { name: 'Add chart' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Revenue/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /Profit/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to dashboard' }));
    await waitFor(() =>
        expect(within(dialog).getByText('Unable to add selected charts.')).toBeVisible()
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to dashboard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mocks.addDashboardChart.mock.calls.map(([input]) => input.chartId)).toEqual([
        'chart-1',
        'chart-2',
        'chart-2',
    ]);
});

it.each(['confirmed', 'rejected'])(
    'keeps a reopened chart selection after an earlier add: %s',
    async result => {
        const gate = deferred<{ itemId: string; posY: number }>();
        mocks.addDashboardChart.mockReturnValueOnce({ unwrap: () => gate.promise });
        const first = screen.getByRole('dialog', { name: 'Add chart' });
        fireEvent.click(within(first).getByRole('button', { name: /Revenue/ }));
        fireEvent.click(within(first).getByRole('button', { name: 'Add to dashboard' }));
        fireEvent.keyDown(document, { key: 'Escape' });
        fireEvent.click(screen.getByRole('button', { name: 'График' }));
        const second = screen.getByRole('dialog', { name: 'Add chart' });
        fireEvent.click(within(second).getByRole('button', { name: /Profit/ }));
        await act(async () => {
            if (result === 'confirmed') {
                gate.resolve({ itemId: 'added', posY: 0 });
            } else {
                gate.reject(new Error('write failed'));
            }
            await gate.promise.catch(() => {});
        });
        expect(screen.getByRole('dialog', { name: 'Add chart' })).toBeVisible();
        expect(
            within(second).getByRole('button', { name: 'Remove Profit' })
        ).toBeVisible();
        expect(within(second).queryByText('Unable to add selected charts.')).toBeNull();
        expect(mocks.addDashboardChart).toHaveBeenCalledOnce();
    }
);
