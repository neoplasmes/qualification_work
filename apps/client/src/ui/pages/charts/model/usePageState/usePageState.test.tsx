import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { expect, it } from 'vitest';

import { useChartsWorkspaceRouteSync } from './useChartsWorkspaceRouteSync';
import { useChartsPageActions } from './usePageState';

it('resumes each base entry and keeps selection cleared on navigation', () => {
    const store = createUiTestRuntime();
    const wrapper = ({ children }: PropsWithChildren) => (
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/charts/edit?id=one']}>
                {children}
            </MemoryRouter>
        </UiTestProvider>
    );
    const hook = renderHook(
        () => {
            useChartsWorkspaceRouteSync();

            return {
                actions: useChartsPageActions(),
                location: useLocation(),
                navigate: useNavigate(),
            };
        },
        { wrapper }
    );
    act(() => hook.result.current.navigate('/datasets'));
    act(() => hook.result.current.navigate('/charts'));
    expect(hook.result.current.location.pathname).toBe('/charts/edit');
    expect(hook.result.current.location.search).toBe('?id=one');
    act(() => hook.result.current.navigate('/charts/view?id=two'));
    act(() => hook.result.current.navigate('/charts'));
    expect(hook.result.current.location.pathname).toBe('/charts/view');
    expect(hook.result.current.location.search).toBe('?id=two');
    act(() => {
        hook.result.current.actions.selectChart(null);
        hook.result.current.navigate('/charts');
    });
    expect(hook.result.current.location.pathname).toBe('/charts');
    expect(hook.result.current.location.search).toBe('');
});
