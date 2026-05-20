import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DashboardsListPanel } from './DashboardsListPanel';

describe('DashboardsListPanel', () => {
    it('validates empty dashboard names before calling create', async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();

        render(
            <DashboardsListPanel
                dashboards={[]}
                loading={false}
                selectedDashboard={undefined}
                creating={false}
                onSelect={vi.fn()}
                onCreate={onCreate}
            />
        );

        await user.click(screen.getByRole('button', { name: /create/i }));

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Dashboard name can not be empty.'
        );
        expect(onCreate).not.toHaveBeenCalled();
    });

    it('creates a dashboard and renders selectable existing dashboards', async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn().mockResolvedValue(undefined);
        const onSelect = vi.fn();

        render(
            <DashboardsListPanel
                dashboards={[
                    {
                        id: 'dashboard-1',
                        orgId: 'org-1',
                        name: 'Revenue',
                        items: [],
                        createdAt: '2026-01-01T00:00:00.000Z',
                        updatedAt: '2026-01-01T00:00:00.000Z',
                    },
                ]}
                loading={false}
                selectedDashboard={undefined}
                creating={false}
                onSelect={onSelect}
                onCreate={onCreate}
            />
        );

        await user.type(screen.getByLabelText('New dashboard'), 'Operations');
        await user.click(screen.getByRole('button', { name: /create/i }));
        await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Operations'));

        await user.click(screen.getByRole('button', { name: /Revenue/ }));
        expect(onSelect).toHaveBeenCalledWith('dashboard-1');
    });
});
