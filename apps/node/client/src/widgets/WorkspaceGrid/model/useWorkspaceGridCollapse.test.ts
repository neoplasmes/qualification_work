import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWorkspaceGridCollapse } from './useWorkspaceGridCollapse';

describe('useWorkspaceGridCollapse', () => {
    it('starts empty and toggles a key on and off', () => {
        const { result } = renderHook(() => useWorkspaceGridCollapse<'left' | 'right'>());

        expect(result.current.isCollapsed('left')).toBe(false);

        act(() => result.current.toggle('left'));
        expect(result.current.isCollapsed('left')).toBe(true);
        expect([...result.current.collapsed]).toEqual(['left']);

        act(() => result.current.toggle('left'));
        expect(result.current.isCollapsed('left')).toBe(false);
    });

    it('seeds from initialCollapsed', () => {
        const { result } = renderHook(() => useWorkspaceGridCollapse<'left'>(['left']));

        expect(result.current.isCollapsed('left')).toBe(true);
    });

    it('collapse and expand are idempotent', () => {
        const { result } = renderHook(() => useWorkspaceGridCollapse<'left'>());

        act(() => result.current.collapse('left'));
        act(() => result.current.collapse('left'));
        expect([...result.current.collapsed]).toEqual(['left']);

        act(() => result.current.expand('left'));
        act(() => result.current.expand('left'));
        expect(result.current.isCollapsed('left')).toBe(false);
    });

    it('changes controller identity when collapsed changes', () => {
        const { result } = renderHook(() => useWorkspaceGridCollapse<'a'>());

        const first = result.current;
        act(() => result.current.toggle('a'));

        expect(result.current).not.toBe(first);
    });
});
