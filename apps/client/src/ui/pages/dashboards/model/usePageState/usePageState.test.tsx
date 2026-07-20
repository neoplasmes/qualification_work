import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { expect, it } from 'vitest';

import { useDashboardsWorkspaceRouteSync } from './useDashboardsWorkspaceRouteSync';
import { useDashboardsPageState } from './usePageState';

it('keeps the URL authoritative and resolves every ID-less entry', () => {
    localStorage.clear();
    localStorage.setItem(
        'dashboardsPage_v1',
        JSON.stringify({
            selectedDashboardId: 'stored',
            workspaceDraftDashboardId: null,
            workspaceDraftName: '',
        })
    );
    const store = createUiTestRuntime({}, true);
    const wrapper = ({ children }: PropsWithChildren) => (
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/dashboards?id=explicit']}>
                {children}
            </MemoryRouter>
        </UiTestProvider>
    );
    const hook = renderHook(
        () => {
            useDashboardsWorkspaceRouteSync();

            return {
                id: useDashboardsPageState(state => state.selectedDashboardId),
                location: useLocation(),
                navigate: useNavigate(),
            };
        },
        { wrapper }
    );
    act(() => store.ui.hydrate());
    expect(hook.result.current.id).toBe('explicit');
    act(() => hook.result.current.navigate('/datasets'));
    act(() => hook.result.current.navigate('/dashboards'));
    expect(hook.result.current.location.search).toBe('?id=explicit');
    act(() => hook.result.current.navigate('/dashboards?id=other'));
    expect(hook.result.current.id).toBe('other');
    act(() => hook.result.current.navigate('/dashboards'));
    expect(hook.result.current.location.search).toBe('?id=other');
    act(() => {
        store.ui.dashboards.getState().selectDashboard(null);
        hook.result.current.navigate('/dashboards');
    });
    expect(hook.result.current.location.search).toBe('');
    expect(hook.result.current.id).toBeNull();
});
