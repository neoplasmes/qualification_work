import type { Session } from '@/core/entities/user';
import { ClientRoot } from '@/main/ClientRoot';
import { createUiTestRuntime } from '@/test/uiRuntime';
import { useActiveOrganization } from '@/ui/session';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { activeOrganizationKey } from './activeOrganization.store';

afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});
const session: Session = {
    user: { ref: 'user:u', id: 'u', email: 'u@example.com', name: 'U', family: 'F' },
    isInitializing: false,
    organizations: [
        { ref: 'organization:first', id: 'first', name: 'First', role: 'owner' },
        { ref: 'organization:saved', id: 'saved', name: 'Saved', role: 'viewer' },
    ],
};
it('keeps stored organization during pending session and validates membership', () => {
    localStorage.setItem(activeOrganizationKey, 'saved');
    const { runtime, ui } = createUiTestRuntime({}, true);
    const wrapper = ({ children }: PropsWithChildren) => (
        <ClientRoot runtime={runtime}>{children}</ClientRoot>
    );
    const hook = renderHook(
        ({ data }: { data: Session | undefined }) => useActiveOrganization(data),
        { wrapper, initialProps: { data: undefined as Session | undefined } }
    );
    expect(ui.activeOrganization.getState().activeOrgId).toBeNull();
    expect(localStorage.getItem(activeOrganizationKey)).toBe('saved');
    act(() => ui.hydrate());
    expect(localStorage.getItem(activeOrganizationKey)).toBe('saved');
    hook.rerender({ data: session });
    expect(hook.result.current.activeOrg?.id).toBe('saved');
    hook.rerender({ data: { ...session, organizations: [session.organizations[0]] } });
    expect(ui.activeOrganization.getState().activeOrgId).toBe('first');
    hook.rerender({ data: { ...session, organizations: [] } });
    expect(localStorage.getItem(activeOrganizationKey)).toBeNull();
});
it('keeps organization selection usable when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
    });
    const { ui } = createUiTestRuntime({}, true);
    expect(() => ui.hydrate()).not.toThrow();
    expect(() => ui.activeOrganization.getState().setActiveOrgId('saved')).not.toThrow();
    expect(ui.activeOrganization.getState().activeOrgId).toBe('saved');
    expect(() => ui.reset()).not.toThrow();
    expect(ui.activeOrganization.getState().activeOrgId).toBeNull();
});
