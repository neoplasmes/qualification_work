import type { AxisGrouping, TimeGranularity } from '@qualification-work/types';

import type { ConfigBind, ConfigFieldKey } from '@/features/Config';

import type { DatasetColumn } from '@/entities/dataset';

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

/**
 * reads form-level grouping mode from a saved chart config
 */
export const getGroupingMode = (grouping: unknown): GroupingMode => {
    const value = grouping as { kind?: string } | undefined | null;

    if (value?.kind === 'time') {
        return 'time';
    }

    if (value?.kind === 'numeric') {
        return 'numeric';
    }

    return 'none';
};

/**
 * returns grouping modes that make sense for the selected column type
 */
export const getGroupingModes = (
    dataType: DatasetColumn['dataType'] | undefined
): GroupingMode[] => {
    const modes: GroupingMode[] = ['none'];

    if (dataType === 'date') {
        modes.push('time');
    }

    if (dataType === 'number') {
        modes.push('numeric');
    }

    return modes;
};

/**
 * falls back to no grouping when a saved mode no longer fits the column
 */
export const normalizeGroupingMode = (
    groupingMode: GroupingMode,
    modes: GroupingMode[]
) => (modes.includes(groupingMode) ? groupingMode : 'none');

/**
 * default time grain used by new chart drafts
 */
export const getDefaultGranularity = (): TimeGranularity => 'month';
