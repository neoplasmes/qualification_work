import type { AxisGrouping, TimeGranularity } from '@qualification-work/types';

import type { DatasetColumn } from '@/entities/dataset';

import type { ConfigBind, ConfigFieldKey } from '@/shared/ui/tools/Config';

import { defaultGranularity, type GroupingMode } from './groupingConfig';

/**
 * minimal axis shape accepted from saved chart configs
 */
export type AxisConfigLike = {
    columnId?: string;
    grouping?: AxisGrouping | unknown;
};

/**
 * flat draft fields required by axis settings
 */
export type AxisDraftFields = {
    columnId: string;
    groupingMode: GroupingMode;
    granularity: TimeGranularity;
    step: number;
};

/**
 * keeps axis column and grouping compatible after column changes
 *
 * @template T draft shape used by the chart settings
 */
export const createAxisColumnBind = <T extends object>(
    columnKey: ConfigFieldKey<T, string>,
    groupingKey: ConfigFieldKey<T, GroupingMode>,
    columns: DatasetColumn[],
    activeColumnId: string
): ConfigBind<T, string> => ({
    get: draft => activeColumnId || (draft[columnKey] as string),
    set: (draft, columnId) => {
        const dataType = columns.find(column => column.id === columnId)?.dataType;
        const groupingMode = draft[groupingKey] as GroupingMode;

        draft[columnKey] = columnId as T[typeof columnKey];
        if (
            (groupingMode === 'time' && dataType !== 'date') ||
            (groupingMode === 'numeric' && dataType !== 'number')
        ) {
            draft[groupingKey] = 'none' as T[typeof groupingKey];
        }
    },
});

/**
 * converts a saved axis config into fields used by the form draft
 */
export const axisConfigToDraftFields = (
    axis: AxisConfigLike | undefined
): AxisDraftFields => {
    const grouping = axis?.grouping as
        | { kind?: string; granularity?: TimeGranularity; step?: number }
        | undefined;
    let groupingMode: GroupingMode = 'none';

    if (grouping?.kind === 'time') {
        groupingMode = 'time';
    }

    if (grouping?.kind === 'numeric') {
        groupingMode = 'numeric';
    }

    return {
        columnId: axis?.columnId ?? '',
        groupingMode,
        granularity: grouping?.granularity ?? defaultGranularity,
        step: grouping?.step ?? 10,
    };
};
