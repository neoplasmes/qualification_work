import type { DashboardMetricItem } from '@/entities/dashboard';

export type MetricTone = 'success' | 'danger' | 'neutral';

type Direction = DashboardMetricItem['targetDirection'];

/**
 * tone of the value relative to its target
 * neutral when there is no value, target or direction
 *
 * @param value
 * @param target
 * @param direction
 * @returns
 */
export const metricTone = (
    value: number | null | undefined,
    target: number | null,
    direction: Direction
): MetricTone => {
    if (value == null || target == null || direction == null) {
        return 'neutral';
    }

    const reached = direction === 'higher' ? value >= target : value <= target;

    return reached ? 'success' : 'danger';
};

/**
 * progress bar fill toward the target in the 0..1 range, 1 = goal reached
 * null when there is nothing to show
 *
 * @param value
 * @param target
 * @param direction
 * @returns
 */
export const metricProgress = (
    value: number | null | undefined,
    target: number | null,
    direction: Direction
): number | null => {
    if (value == null || target == null || direction == null) {
        return null;
    }

    let fill: number;
    if (direction === 'higher') {
        fill = target === 0 ? 1 : value / target;
    } else {
        fill = value === 0 ? 1 : target / value;
    }

    return Math.min(1, Math.max(0, fill));
};
