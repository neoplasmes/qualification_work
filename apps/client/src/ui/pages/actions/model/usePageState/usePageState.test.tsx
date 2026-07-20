import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { expect, it } from 'vitest';

import { useActionsWorkspaceRouteSync } from './useActionsWorkspaceRouteSync';
import { useActionsPageActions } from './usePageState';

it('resumes each base entry and keeps selection cleared on navigation', () => {
    const store = createUiTestRuntime();
    const wrapper = ({ children }: PropsWithChildren) => (
        <UiTestProvider store={store}>
            <MemoryRouter initialEntries={['/actions/edit?id=one']}>
                {children}
            </MemoryRouter>
        </UiTestProvider>
    );
    const hook = renderHook(
        () => {
            useActionsWorkspaceRouteSync();

            return {
                actions: useActionsPageActions(),
                location: useLocation(),
                navigate: useNavigate(),
            };
        },
        { wrapper }
    );
    act(() => hook.result.current.navigate('/datasets'));
    act(() => hook.result.current.navigate('/actions'));
    expect(hook.result.current.location.pathname).toBe('/actions/edit');
    expect(hook.result.current.location.search).toBe('?id=one');
    act(() => hook.result.current.navigate('/actions/view?id=two'));
    act(() => hook.result.current.navigate('/actions'));
    expect(hook.result.current.location.pathname).toBe('/actions/view');
    expect(hook.result.current.location.search).toBe('?id=two');
    act(() => {
        hook.result.current.actions.selectAction(null);
        hook.result.current.navigate('/actions');
    });
    expect(hook.result.current.location.pathname).toBe('/actions');
    expect(hook.result.current.location.search).toBe('');
});
