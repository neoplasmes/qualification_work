import type { GroupingMode } from '../model';

export const chartRowLimit = 200;

export const groupingLabels: Record<GroupingMode, string> = {
    none: 'Без группировки',
    time: 'По времени',
    numeric: 'По интервалам',
};
