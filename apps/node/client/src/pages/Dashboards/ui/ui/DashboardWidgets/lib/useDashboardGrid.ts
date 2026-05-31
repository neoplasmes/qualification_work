import {
    dashboardGridColumns,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { GridStack, type GridItemHTMLElement, type GridStackOptions } from 'gridstack';
import { useEffect, useRef, useState } from 'react';

import { nodesToLayout } from './nodesToLayout';

export type DashboardGridItem = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
};

const gridOptions: GridStackOptions = {
    column: dashboardGridColumns,
    cellHeight: 64,
    margin: 0,
    float: false,
    columnOpts: {
        breakpoints: [{ w: 700, c: 1, layout: 'list' }],
        layout: 'list',
    },
    // the whole cell drags, except interactive controls
    draggable: { cancel: 'button, a, input, select, textarea, .no-drag' },
};

const getGridElement = (content: HTMLElement) =>
    content.closest('.grid-stack-item') as GridItemHTMLElement | null;

const itemToWidget = (item: DashboardGridItem) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW,
    minH: item.minH,
});

const snapshotLayout = (grid: GridStack) => nodesToLayout(grid.engine.nodes);

const syncGridInteractivity = (grid: GridStack) => {
    const enabled = grid.getColumn() > 1;
    grid.enableMove(enabled);
    grid.enableResize(enabled);
};

/**
 * drives a gridstack instance from a declarative item list
 * gridstack owns geometry and the dom cells, react renders cell content via
 * portals into the hosts returned here. user drag/resize is reported through
 * onLayoutChange, programmatic syncing is guarded so it never persists itself
 *
 * @param items
 * @param onLayoutChange
 * @returns container ref to attach and the per-item content hosts
 */
export const useDashboardGrid = (
    items: DashboardGridItem[],
    onLayoutChange: (layout: DashboardItemLayoutInput[]) => void
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<GridStack | null>(null);
    const hostsRef = useRef<Map<string, HTMLElement>>(new Map());
    const applyingRef = useRef(false);
    const onChangeRef = useRef(onLayoutChange);
    onChangeRef.current = onLayoutChange;

    const [hosts, setHosts] = useState<Map<string, HTMLElement>>(new Map());

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const grid = GridStack.init(gridOptions, containerRef.current);
        gridRef.current = grid;

        const handleLayoutStop = () => {
            if (applyingRef.current) {
                return;
            }

            onChangeRef.current(snapshotLayout(grid));
        };
        const handleResize = () => syncGridInteractivity(grid);

        grid.on('dragstop', handleLayoutStop);
        grid.on('resizestop', handleLayoutStop);
        window.addEventListener('resize', handleResize);
        syncGridInteractivity(grid);

        return () => {
            window.removeEventListener('resize', handleResize);
            grid.off('dragstop');
            grid.off('resizestop');
            grid.destroy(false);
            gridRef.current = null;
            hostsRef.current.clear();
        };
    }, []);

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) {
            return;
        }

        applyingRef.current = true;
        grid.batchUpdate();

        const seen = new Set<string>();
        for (const item of items) {
            seen.add(item.id);
            if (hostsRef.current.has(item.id)) {
                const content = hostsRef.current.get(item.id);
                const element = content ? getGridElement(content) : null;
                if (element) {
                    grid.update(element, itemToWidget(item));
                }

                continue;
            }

            const element = grid.addWidget(itemToWidget(item));
            const content = element.querySelector<HTMLElement>(
                '.grid-stack-item-content'
            );
            if (content) {
                hostsRef.current.set(item.id, content);
            }
        }

        const staleIds: string[] = [];
        for (const [id] of hostsRef.current) {
            if (seen.has(id)) {
                continue;
            }

            staleIds.push(id);
        }

        for (const id of staleIds) {
            const content = hostsRef.current.get(id);
            const itemElement = content ? getGridElement(content) : null;
            if (itemElement) {
                grid.removeWidget(itemElement, true);
            }
            hostsRef.current.delete(id);
        }

        grid.batchUpdate(false);
        syncGridInteractivity(grid);
        applyingRef.current = false;
        setHosts(new Map(hostsRef.current));
    }, [items]);

    return { containerRef, hosts };
};
