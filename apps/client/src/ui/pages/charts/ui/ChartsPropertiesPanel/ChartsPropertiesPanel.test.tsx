import { ChartsPropertiesPanel } from '.';
import type { Chart } from '@/core/entities/chart';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: {} }),
    useActiveOrganization: () => ({ activeOrg: { id: 'org' } }),
}));

it('retains confirmed delete refresh feedback after selection and route clear', async () => {
    const store = createUiTestRuntime();
    const chart: Chart = {
        ref: 'chart:org/chart',
        id: 'chart',
        orgId: 'org',
        datasetId: 'dataset',
        name: 'Revenue',
        chartType: 'bar',
        config: {
            kind: 'bar',
            dimension: { columnId: 'category' },
            measures: [{ aggregate: 'count' }],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    };
    let deleted = false;
    store.runtime.dependencies.listDatasets.execute = async () => [];
    store.runtime.dependencies.getChart.execute = async () => {
        if (deleted) {
            throw new Error('refresh unavailable');
        }

        return chart;
    };
    store.runtime.dependencies.deleteChart.execute = async () => {
        deleted = true;
    };
    render(
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/charts/view?id=chart']}>
                <ChartsPropertiesPanel />
            </MemoryRouter>
        </UiTestProvider>
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Удалить график' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
    expect(
        await screen.findByText(
            'График удалён, но обновить список не удалось. Перезагрузите страницу.'
        )
    ).toBeVisible();
    expect(
        screen.queryByRole('button', { name: 'Подтвердить удаление' })
    ).not.toBeInTheDocument();
});
