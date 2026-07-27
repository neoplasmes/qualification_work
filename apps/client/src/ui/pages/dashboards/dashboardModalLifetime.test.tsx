import './test';

import { deferred } from '@/test/readFixtures';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

import { DashboardsPage } from './Dashboards.page';
import { datasetMetadataFixtures, mocks } from './test';

vi.mock('./ui/DashboardWidgets', () => ({ DashboardWidgets: () => null }));

it('keeps a second metric draft after closing the first pending save', async () => {
    vi.clearAllMocks();
    const gate = deferred<{ itemId: string; posY: number }>();
    mocks.addDashboardMetric.mockReturnValue({ unwrap: () => gate.promise });
    const store = createUiTestRuntime({ datasetMetadata: datasetMetadataFixtures });
    render(
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/dashboards?id=dashboard-1']}>
                <DashboardsPage />
            </MemoryRouter>
        </UiTestProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Метрика' }));
    await waitFor(() =>
        expect(screen.getByLabelText('Название метрики')).toHaveValue('Среднее Score')
    );
    fireEvent.submit(screen.getByRole('form', { name: 'Добавить метрику' }));
    expect(mocks.addDashboardMetric).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Метрика' }));
    fireEvent.change(screen.getByLabelText('Название метрики'), {
        target: { value: 'Second local draft' },
    });
    await act(async () => {
        gate.resolve({ itemId: 'first', posY: 0 });
        await gate.promise;
    });
    expect(screen.getByRole('dialog', { name: 'Добавить метрику' })).toBeVisible();
    expect(screen.getByLabelText('Название метрики')).toHaveValue('Second local draft');
    expect(mocks.addDashboardMetric).toHaveBeenCalledOnce();
});
