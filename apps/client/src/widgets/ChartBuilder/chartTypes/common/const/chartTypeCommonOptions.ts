import type { GroupingMode } from '../model';

export const chartRowLimit = 200;

export const groupingLabels: Record<GroupingMode, string> = {
    none: 'None',
    time: 'By time',
    numeric: 'By range',
};
