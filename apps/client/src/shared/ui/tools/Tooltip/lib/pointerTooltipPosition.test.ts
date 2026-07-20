import { describe, expect, it } from 'vitest';

import { getPointerTooltipPosition } from './pointerTooltipPosition';

describe('getPointerTooltipPosition', () => {
    it('keeps tooltip to the right while it fits in the viewport', () => {
        expect(
            getPointerTooltipPosition({
                clientX: 80,
                clientY: 40,
                viewportWidth: 400,
                gap: 8,
                margin: 8,
                maxWidth: 260,
            })
        ).toEqual({
            x: 80,
            y: 48,
            gap: 8,
            placement: 'right',
        });
    });

    it('places tooltip to the left when the right side would overflow', () => {
        expect(
            getPointerTooltipPosition({
                clientX: 360,
                clientY: 40,
                viewportWidth: 400,
                gap: 8,
                margin: 8,
                maxWidth: 260,
            })
        ).toEqual({
            x: 360,
            y: 48,
            gap: 8,
            placement: 'left',
        });
    });

    it('keeps left placement inside a narrow viewport when possible', () => {
        expect(
            getPointerTooltipPosition({
                clientX: 40,
                clientY: 0,
                viewportWidth: 120,
                gap: 8,
                margin: 8,
                maxWidth: 260,
            })
        ).toEqual({
            x: 120,
            y: 8,
            gap: 8,
            placement: 'left',
        });
    });
});
