import { describe, expect, it } from 'vitest';

import { getSeriesColor } from './barChartConfig';

type Rgb = {
    r: number;
    g: number;
    b: number;
};

const hexToRgb = (hex: string): Rgb => ({
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
});

const getHue = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    if (delta === 0) {
        return 0;
    }

    const rawHue =
        max === rn
            ? 60 * (((gn - bn) / delta) % 6)
            : max === gn
              ? 60 * ((bn - rn) / delta + 2)
              : 60 * ((rn - gn) / delta + 4);

    return (rawHue + 360) % 360;
};

const getHueDistance = (left: number, right: number) => {
    const diff = Math.abs(left - right);

    return Math.min(diff, 360 - diff);
};

describe('getSeriesColor', () => {
    it('keeps grouped bar series monochrome relative to the configured color', () => {
        const baseColor = '#872557';
        const colors = Array.from({ length: 6 }, (_, index) =>
            getSeriesColor(baseColor, index)
        );
        const baseHue = getHue(baseColor);

        expect(colors[0]).toBe(baseColor);
        expect(new Set(colors).size).toBe(colors.length);
        expect(colors.every(color => getHueDistance(getHue(color), baseHue) < 1)).toBe(
            true
        );
    });
});
