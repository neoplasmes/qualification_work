import { describe, expect, it, vi } from 'vitest';

import type { WorkspaceGridPanelModel } from '../../../model';

import { fitPanels } from './fitPanels';

// minimal fake model exposing only what fitPanels touches
const fake = (current: number, min: number) => {
    const setFittedSizePx = vi.fn((size: number) => size);

    return {
        model: {
            getCurrentSizePx: () => current,
            getMinSizePx: () => min,
            setFittedSizePx,
        } as unknown as WorkspaceGridPanelModel,
        setFittedSizePx,
    };
};

const toMap = (...entries: ReturnType<typeof fake>[]) => {
    const map = new Map<unknown, WorkspaceGridPanelModel>();
    entries.forEach((e, i) => map.set(i, e.model));

    return map;
};

describe('fitPanels', () => {
    it('no-ops on non-positive available size', () => {
        const a = fake(200, 100);
        fitPanels(0, toMap(a));

        expect(a.setFittedSizePx).not.toHaveBeenCalled();
    });

    it('no-ops on empty map', () => {
        fitPanels(500, new Map());
    });

    it('no-ops when total size is zero', () => {
        const a = fake(0, 0);
        fitPanels(500, toMap(a));

        expect(a.setFittedSizePx).not.toHaveBeenCalled();
    });

    it('distributes overflow by headroom above min', () => {
        const a = fake(200, 100);
        const b = fake(200, 100);
        // total 400, available 300, totalMin 200, remaining 100, equal headroom
        fitPanels(300, toMap(a, b));

        expect(a.setFittedSizePx).toHaveBeenCalledWith(150);
        expect(b.setFittedSizePx).toHaveBeenCalledWith(150);
    });

    it('shrinks proportionally when container is below total min', () => {
        const a = fake(200, 100);
        const b = fake(200, 100);
        // total 400, available 150 < totalMin 200, ratio 0.375
        fitPanels(150, toMap(a, b));

        expect(a.setFittedSizePx).toHaveBeenCalledWith(75);
        expect(b.setFittedSizePx).toHaveBeenCalledWith(75);
    });

    it('expands the second-to-last panel on underflow with > 2 panels', () => {
        const a = fake(100, 100);
        const b = fake(100, 100);
        const c = fake(100, 100);
        // total 300, available 360, target index 1 gets the slack
        fitPanels(360, toMap(a, b, c));

        expect(a.setFittedSizePx).not.toHaveBeenCalled();
        expect(b.setFittedSizePx).toHaveBeenCalledWith(160);
        expect(c.setFittedSizePx).not.toHaveBeenCalled();
    });

    it('expands the last panel on underflow with <= 2 panels', () => {
        const a = fake(100, 100);
        const b = fake(100, 100);
        fitPanels(260, toMap(a, b));

        expect(a.setFittedSizePx).not.toHaveBeenCalled();
        expect(b.setFittedSizePx).toHaveBeenCalledWith(160);
    });

    it('expands a single panel to fill the space', () => {
        const a = fake(100, 100);
        fitPanels(200, toMap(a));

        expect(a.setFittedSizePx).toHaveBeenCalledWith(200);
    });

    it('no-ops when total equals available', () => {
        const a = fake(150, 100);
        const b = fake(150, 100);
        fitPanels(300, toMap(a, b));

        expect(a.setFittedSizePx).not.toHaveBeenCalled();
        expect(b.setFittedSizePx).not.toHaveBeenCalled();
    });
});
