import { describe, expect, it } from 'vitest';

import {
    dashboardChartAspectRatioConstraint,
    getConstrainedChartFrameSize,
} from './chartFrame';

describe('getConstrainedChartFrameSize', () => {
    it('keeps dashboard chart frames between 1.25:1 and 1:2 height to width', () => {
        expect(
            getConstrainedChartFrameSize(640, 200, dashboardChartAspectRatioConstraint)
        ).toEqual({ width: 400, height: 200 });
        expect(
            getConstrainedChartFrameSize(200, 640, dashboardChartAspectRatioConstraint)
        ).toEqual({ width: 200, height: 250 });
        expect(
            getConstrainedChartFrameSize(360, 240, dashboardChartAspectRatioConstraint)
        ).toEqual({ width: 360, height: 240 });
    });
});
