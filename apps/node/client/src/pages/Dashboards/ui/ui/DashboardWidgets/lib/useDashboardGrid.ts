import {
    dashboardGridColumns,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';
import { GridStack, type GridItemHTMLElement, type GridStackOptions } from 'gridstack';
import { useLayoutEffect, useRef, useState } from 'react';

import { useRafThrottle } from '@/shared/lib/useRafThrottle';

import { nodesToLayout } from './nodesToLayout';

const BASE_CELL_HEIGHT = 64;
const MIN_CELL_HEIGHT = 44;
const CELL_ASPECT = 0.8;

const getResponsiveCellHeight = (containerWidth: number) => {
    const cellWidth = containerWidth / dashboardGridColumns;

    return Math.round(
        Math.min(BASE_CELL_HEIGHT, Math.max(MIN_CELL_HEIGHT, cellWidth * CELL_ASPECT))
    );
};

export type DashboardGridItem = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
};

const getInitialCellHeight = (container: HTMLElement) => {
    const width = container.clientWidth;

    return width > 0 ? getResponsiveCellHeight(width) : BASE_CELL_HEIGHT;
};

const createGridOptions = (cellHeight: number): GridStackOptions => ({
    column: dashboardGridColumns,
    cellHeight,
    margin: 0,
    float: false,
    // the whole cell drags, except interactive controls
    draggable: { cancel: 'button, a, input, select, textarea, .no-drag' },
});

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
    const cellHeightRef = useRef<number | null>(null);
    const onChangeRef = useRef(onLayoutChange);
    onChangeRef.current = onLayoutChange;

    const [hosts, setHosts] = useState<Map<string, HTMLElement>>(new Map());

    const applyResponsiveCellHeight = useRafThrottle(() => {
        const grid = gridRef.current;
        const width = containerRef.current?.clientWidth ?? 0;
        if (!grid || width <= 0) {
            return;
        }

        const next = getResponsiveCellHeight(width);
        if (cellHeightRef.current === next) {
            return;
        }

        cellHeightRef.current = next;
        grid.cellHeight(next);
    });

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const initialCellHeight = getInitialCellHeight(container);
        const grid = GridStack.init(createGridOptions(initialCellHeight), container);
        gridRef.current = grid;
        cellHeightRef.current = initialCellHeight;

        const handleLayoutStop = () => {
            if (applyingRef.current) {
                return;
            }

            onChangeRef.current(snapshotLayout(grid));
        };

        grid.on('dragstop', handleLayoutStop);
        grid.on('resizestop', handleLayoutStop);

        const resizeObserver = new ResizeObserver(() => applyResponsiveCellHeight());
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            grid.off('dragstop');
            grid.off('resizestop');
            grid.destroy(false);
            gridRef.current = null;
            cellHeightRef.current = null;
            hostsRef.current.clear();
        };
    }, [applyResponsiveCellHeight]);

    useLayoutEffect(() => {
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
        applyingRef.current = false;
        setHosts(new Map(hostsRef.current));
    }, [items]);

    return { containerRef, hosts };
};
