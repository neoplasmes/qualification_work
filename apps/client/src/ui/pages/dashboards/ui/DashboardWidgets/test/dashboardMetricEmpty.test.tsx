import './dashboardWidgetsFixtures';

import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

import { metricWithTrend, renderWidgets } from './dashboardWidgetsFixtures';

it('keeps null distinct from zero in a readable metric stat', async () => {
    renderWidgets({ items: [{ ...metricWithTrend, value: null, showTrend: false }] });
    await waitFor(() => expect(screen.getByText('Нет данных')).toBeVisible());
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.queryByRole('meter')).toBeNull();
});
