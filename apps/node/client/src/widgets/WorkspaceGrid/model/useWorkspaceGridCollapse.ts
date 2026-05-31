import { useMemo, useState } from 'react';

import type { WorkspaceGridCollapseController } from './types';

/**
 * standalone collapse controller with internal state. pass the key union as the
 * generic to type every method, e.g. useWorkspaceGridCollapse<'left' | 'right'>()
 *
 * @param initialCollapsed
 * @returns
 */
export const useWorkspaceGridCollapse = <const K extends string = string>(
    initialCollapsed?: readonly K[]
): WorkspaceGridCollapseController<K> => {
    const [collapsed, setCollapsed] = useState<ReadonlySet<K>>(
        () => new Set(initialCollapsed)
    );

    // identity of the controller changes with collapsed, which is what consumers
    // (the grid group) depend on to recompute their layout
    return useMemo(
        () => ({
            collapsed,
            isCollapsed: (key: K) => collapsed.has(key),
            collapse: (key: K) =>
                setCollapsed(prev => (prev.has(key) ? prev : new Set(prev).add(key))),
            expand: (key: K) =>
                setCollapsed(prev => {
                    if (!prev.has(key)) {
                        return prev;
                    }

                    const next = new Set(prev);
                    next.delete(key);

                    return next;
                }),
            toggle: (key: K) =>
                setCollapsed(prev => {
                    const next = new Set(prev);

                    if (next.has(key)) {
                        next.delete(key);
                    } else {
                        next.add(key);
                    }

                    return next;
                }),
        }),
        [collapsed]
    );
};
