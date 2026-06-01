export const DEFAULT_CHART_COLOR = '#872557';

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

type Rgb = {
    r: number;
    g: number;
    b: number;
};

type Hsl = {
    h: number;
    s: number;
    l: number;
};

export const isChartColor = (value: unknown): value is string =>
    typeof value === 'string' && HEX_COLOR_RE.test(value);

export const normalizeChartColor = (value: unknown) =>
    isChartColor(value) ? value.toLowerCase() : DEFAULT_CHART_COLOR;

export const getChartColorFromConfig = (config: Record<string, unknown>) => {
    const style = config.style as { color?: unknown } | undefined;

    return normalizeChartColor(style?.color);
};

const hexToRgb = (hex: string): Rgb => ({
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
});

const rgbToHex = ({ r, g, b }: Rgb) =>
    `#${[r, g, b]
        .map(value => Math.round(Math.max(0, Math.min(255, value))).toString(16))
        .map(value => value.padStart(2, '0'))
        .join('')}`;

const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    const l = (max + min) / 2;

    if (d === 0) {
        return { h: 0, s: 0, l };
    }

    const s = d / (1 - Math.abs(2 * l - 1));
    const h =
        max === rn
            ? 60 * (((gn - bn) / d) % 6)
            : max === gn
              ? 60 * ((bn - rn) / d + 2)
              : 60 * ((rn - gn) / d + 4);

    return { h: (h + 360) % 360, s, l };
};

const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [rn, gn, bn] =
        h < 60
            ? [c, x, 0]
            : h < 120
              ? [x, c, 0]
              : h < 180
                ? [0, c, x]
                : h < 240
                  ? [0, x, c]
                  : h < 300
                    ? [x, 0, c]
                    : [c, 0, x];

    return {
        r: (rn + m) * 255,
        g: (gn + m) * 255,
        b: (bn + m) * 255,
    };
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

const monochromeLightnessOffsets = [0, 0.22, -0.15, 0.38, -0.3, 0.1, -0.4, 0.46];

export const mixChartColors = (from: string, to: string, weight: number) => {
    const a = hexToRgb(normalizeChartColor(from));
    const b = hexToRgb(normalizeChartColor(to));

    return rgbToHex({
        r: a.r + (b.r - a.r) * weight,
        g: a.g + (b.g - a.g) * weight,
        b: a.b + (b.b - a.b) * weight,
    });
};

// keeps hue and saturation, sets only lightness for a monochromatic shade
export const withChartLightness = (color: string, lightness: number) => {
    const hsl = rgbToHsl(hexToRgb(normalizeChartColor(color)));

    return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: clampUnit(lightness) }));
};

export const buildMonochromeChartPalette = (baseColor: string, size: number) => {
    const base = normalizeChartColor(baseColor);
    const hsl = rgbToHsl(hexToRgb(base));

    return Array.from({ length: Math.max(1, size) }, (_, index) => {
        if (index === 0) {
            return base;
        }

        const offset =
            monochromeLightnessOffsets[index % monochromeLightnessOffsets.length];
        const cycle = Math.floor(index / monochromeLightnessOffsets.length);
        const cycleOffset = cycle * (offset >= 0 ? 0.04 : -0.04);

        return rgbToHex(
            hslToRgb({
                h: hsl.h,
                s: clampUnit(hsl.s + (index % 2 === 0 ? 0.06 : -0.1)),
                l: Math.min(0.86, Math.max(0.16, hsl.l + offset + cycleOffset)),
            })
        );
    });
};

export const buildChartPalette = (baseColor: string, size: number) => {
    const base = normalizeChartColor(baseColor);
    const hsl = rgbToHsl(hexToRgb(base));

    return Array.from({ length: Math.max(1, size) }, (_, index) => {
        if (index === 0) {
            return base;
        }

        return rgbToHex(
            hslToRgb({
                h: (hsl.h + index * 34) % 360,
                s: Math.min(0.82, Math.max(0.42, hsl.s + (index % 2 ? 0.08 : -0.04))),
                l: Math.min(0.72, Math.max(0.32, hsl.l + ((index % 3) - 1) * 0.12)),
            })
        );
    });
};
