import { DashboardMetricModal } from '.';
import type { Dashboard } from '@/core/entities/dashboard';
import type { DashboardMetricItem } from '@/core/entities/dashboardItem';
import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

const mocks = vi.hoisted(() => ({ executeOutcome: vi.fn() }));
vi.mock('@/env/cache/useCommand', () => ({
    useCommand: () => ({ executeOutcome: mocks.executeOutcome, isPending: false }),
}));
vi.mock('@/env/cache/useRead', () => ({
    useRead: () => ({ data: { value: 50 }, isFetching: false }),
}));
vi.mock('@/ui/session', () => ({
    useSession: () => ({ data: undefined }),
    useActiveOrganization: () => ({ activeOrg: { id: 'o' } }),
}));
const item: DashboardMetricItem = {
    ref: 'dashboardItem:o/d/i',
    id: 'i',
    kind: 'metric',
    layout: { posX: 0, posY: 0, width: 3, height: 3 },
    datasetId: 'data',
    name: 'Total',
    expression: 'sum(value)',
    format: '₽',
    valueMultiplier: 1,
    target: 40,
    targetDirection: 'higher',
    showTrend: false,
    timeColumn: null,
    timeBucket: null,
    value: 50,
};
const dashboard: Dashboard = {
    ref: 'dashboard:o/d',
    id: 'd',
    orgId: 'o',
    name: 'Board',
    items: [item],
    createdAt: '',
    updatedAt: '',
};
const datasets: DatasetMetadata[] = [
    {
        dataset: {
            ref: 'dataset:o/data',
            id: 'data',
            orgId: 'o',
            name: 'Data',
            sourceType: 'manual',
            createdAt: '',
            updatedAt: '',
        },
        columns: [
            {
                ref: 'datasetColumn:o/data/c',
                id: 'c',
                datasetId: 'data',
                key: 'value',
                displayName: 'Value',
                dataType: 'number',
                orderIndex: 0,
                isAnalyzable: true,
            },
        ],
        totalRows: 1,
    },
];
beforeEach(() => mocks.executeOutcome.mockReset());

it('keeps dirty metric fields when metadata and detail refresh while open', async () => {
    const store = createUiTestRuntime();
    const onClose = vi.fn();
    const onSynchronizedError = vi.fn();
    const { rerender } = render(
        <UiTestProvider store={store}>
            <MemoryRouter>
                <DashboardMetricModal
                    dashboard={dashboard}
                    datasets={datasets}
                    item={item}
                    onClose={onClose}
                    onSynchronizedError={onSynchronizedError}
                />
            </MemoryRouter>
        </UiTestProvider>
    );
    fireEvent.change(screen.getByLabelText('Metric name'), {
        target: { value: 'Unsaved local name' },
    });
    fireEvent.change(screen.getByLabelText(/Target.*Unsaved local name/), {
        target: { value: '75' },
    });
    rerender(
        <UiTestProvider store={store}>
            <MemoryRouter>
                <DashboardMetricModal
                    dashboard={{ ...dashboard, name: 'Refreshed' }}
                    datasets={datasets.map(dataset => ({ ...dataset }))}
                    item={{ ...item, value: 60 }}
                    onClose={onClose}
                    onSynchronizedError={onSynchronizedError}
                />
            </MemoryRouter>
        </UiTestProvider>
    );
    expect(screen.getByLabelText('Metric name')).toHaveValue('Unsaved local name');
    expect(screen.getByLabelText(/Target.*Unsaved local name/)).toHaveValue(75);
});

it('closes after a confirmed metric write and exposes synchronization failure', async () => {
    mocks.executeOutcome.mockResolvedValue({
        data: undefined,
        syncError: new Error('read failed'),
    });
    const store = createUiTestRuntime();
    const onClose = vi.fn();
    const onSynchronizedError = vi.fn();
    render(
        <UiTestProvider store={store}>
            <MemoryRouter>
                <DashboardMetricModal
                    dashboard={dashboard}
                    datasets={datasets}
                    item={item}
                    onClose={onClose}
                    onSynchronizedError={onSynchronizedError}
                />
            </MemoryRouter>
        </UiTestProvider>
    );
    fireEvent.submit(screen.getByRole('form', { name: 'Edit metric' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mocks.executeOutcome).toHaveBeenCalledOnce();
    expect(onSynchronizedError).toHaveBeenCalledWith(
        expect.stringContaining('сохранена')
    );
});
