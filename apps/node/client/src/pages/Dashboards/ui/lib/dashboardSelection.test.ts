import { describe, expect, it } from 'vitest';

import type { Dashboard } from '@/entities/dashboard';

import { getResolvedDashboard, getSelectedDashboard } from './dashboardSelection';

const createDashboard = (id: string): Dashboard => ({
    id,
    orgId: 'org-1',
    name: id,
    items: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
});

const dashboards = [createDashboard('dashboard-1'), createDashboard('dashboard-2')];

describe('dashboardSelection', () => {
    it('does not fall back when dashboard selection is explicitly empty', () => {
        expect(getSelectedDashboard(dashboards, null)).toBeUndefined();
    });

    it('falls back to the first dashboard only for stale persisted ids', () => {
        expect(getSelectedDashboard(dashboards, 'stale-dashboard')).toBe(dashboards[0]);
    });

    it('ignores stale dashboard query data for another dashboard', () => {
        expect(getResolvedDashboard(dashboards[1], dashboards[0])).toBe(dashboards[0]);
        expect(getResolvedDashboard(dashboards[0], undefined)).toBeUndefined();
    });
});
