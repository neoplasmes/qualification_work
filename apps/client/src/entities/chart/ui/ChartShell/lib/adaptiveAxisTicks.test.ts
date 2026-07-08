import { describe, expect, it } from 'vitest';

import { getAdaptiveAxisTickLabels } from './adaptiveAxisTicks';

describe('getAdaptiveAxisTickLabels', () => {
    it('keeps all labels when they fit', () => {
        expect(
            getAdaptiveAxisTickLabels({
                labels: ['A', 'B', 'C'],
                availableSpace: 240,
                minSpacing: 60,
            })
        ).toEqual(['A', 'B', 'C']);
    });

    it('keeps edges and thins middle labels when space is tight', () => {
        expect(
            getAdaptiveAxisTickLabels({
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                availableSpace: 180,
                minSpacing: 60,
            })
        ).toEqual(['A', 'C', 'E', 'G']);
    });

    it('keeps edge labels when space cannot be measured', () => {
        expect(
            getAdaptiveAxisTickLabels({
                labels: ['A', 'B', 'C'],
                availableSpace: 0,
                minSpacing: 60,
            })
        ).toEqual(['A', 'C']);
    });
});
