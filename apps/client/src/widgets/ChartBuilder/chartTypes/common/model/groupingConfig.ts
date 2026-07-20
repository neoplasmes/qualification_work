import type { AxisGrouping, TimeGranularity } from '@qualification-work/types';

import type { DatasetColumn } from '@/entities/dataset';

import type { ConfigBind, ConfigFieldKey } from '@/shared/ui/tools/Config';

/**
 * form-level grouping state shared by axis based charts
 */
export type GroupingMode = 'none' | 'time' | 'numeric';

/**
 * keeps grouping mode inside the modes allowed by the current column
 *
 * @template T draft shape used by the chart settings
 */
export const createGroupingModeBind = <T extends object>(
    key: ConfigFieldKey<T, GroupingMode>,
    modes: GroupingMode[]
): ConfigBind<T, GroupingMode> => ({
    get: draft => {
        const mode = draft[key] as GroupingMode;

        return modes.includes(mode) ? mode : 'none';
    },
    set: (draft, value) => {
        draft[key] = value as T[typeof key];
    },
});

/**
 * builds the chart config grouping from the form-level mode
 */
export const buildGrouping = (
    mode: GroupingMode,
    granularity: TimeGranularity,
    step: number
): AxisGrouping | undefined => {
    if (mode === 'time') {
        return { kind: 'time', granularity };
    }

    if (mode === 'numeric') {
        return { kind: 'numeric', step };
    }

    return undefined;
};

const defaultGroupingModes: GroupingMode[] = ['none'];
const dateGroupingModes: GroupingMode[] = ['none', 'time'];
const numberGroupingModes: GroupingMode[] = ['none', 'numeric'];

/**
 * returns grouping modes that make sense for the selected column type
 */
export const getGroupingModes = (
    dataType: DatasetColumn['dataType'] | undefined
): GroupingMode[] => {
    if (dataType === 'date') {
        return dateGroupingModes;
    }

    if (dataType === 'number') {
        return numberGroupingModes;
    }

    return defaultGroupingModes;
};

/**
 * default time grain used by new chart drafts
 */
export const defaultGranularity: TimeGranularity = 'month';
