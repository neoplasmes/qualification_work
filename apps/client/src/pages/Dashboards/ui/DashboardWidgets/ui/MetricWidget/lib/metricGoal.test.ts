import { describe, expect, it } from 'vitest';

import { metricProgress, metricTargetDelta, metricTone } from './metricGoal';

describe('metricTone', () => {
    it('is neutral without value, target or direction', () => {
        expect(metricTone(null, 100, 'higher')).toBe('neutral');
        expect(metricTone(50, null, 'higher')).toBe('neutral');
        expect(metricTone(50, 100, null)).toBe('neutral');
    });

    it('colors a higher-is-better goal', () => {
        expect(metricTone(120, 100, 'higher')).toBe('success');
        expect(metricTone(100, 100, 'higher')).toBe('success');
        expect(metricTone(80, 100, 'higher')).toBe('danger');
    });

    it('colors a lower-is-better goal', () => {
        expect(metricTone(80, 100, 'lower')).toBe('success');
        expect(metricTone(120, 100, 'lower')).toBe('danger');
    });
});

describe('metricProgress', () => {
    it('is null without a target', () => {
        expect(metricProgress(50, null, 'higher')).toBeNull();
    });

    it('fills toward a higher target, clamped to 1', () => {
        expect(metricProgress(50, 100, 'higher')).toBe(0.5);
        expect(metricProgress(150, 100, 'higher')).toBe(1);
    });

    it('fills as the value drops toward a lower target', () => {
        expect(metricProgress(200, 100, 'lower')).toBe(0.5);
        expect(metricProgress(50, 100, 'lower')).toBe(1);
    });
});

describe('metricTargetDelta', () => {
    it('formats a signed percentage difference from target', () => {
        expect(metricTargetDelta(396.48, 350, 'higher')).toEqual({
            label: '+13,3%',
            tone: 'success',
        });
    });

    it('keeps lower-is-better goal coloring independent from the sign', () => {
        expect(metricTargetDelta(120, 100, 'lower')).toEqual({
            label: '+20%',
            tone: 'danger',
        });
    });

    it('is null when target delta cannot be calculated', () => {
        expect(metricTargetDelta(50, 0, 'higher')).toBeNull();
        expect(metricTargetDelta(50, null, 'higher')).toBeNull();
    });
});
