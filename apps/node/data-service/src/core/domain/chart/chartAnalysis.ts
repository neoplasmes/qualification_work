import { ValidationError } from '@qualification-work/microservice-utils';
import type { ChartConfig } from '@qualification-work/types';

type AnalysisColumn = {
    id: string;
    displayName?: string;
    isAnalyzable: boolean;
};

export function getChartConfigColumnIds(config: ChartConfig): string[] {
    const ids: string[] = [];

    const push = (columnId: string | undefined) => {
        if (columnId) {
            ids.push(columnId);
        }
    };

    for (const filter of config.filters ?? []) {
        push(filter.columnId);
    }

    if (config.kind === 'pie') {
        push(config.slice.columnId);
        push(config.measure.columnId);
    }

    if (config.kind === 'heatmap') {
        push(config.x.columnId);
        push(config.y.columnId);
        push(config.measure.columnId);
    }

    if (config.kind === 'bar' || config.kind === 'line') {
        push(config.dimension.columnId);
        push(config.series?.columnId);
        for (const measure of config.measures) {
            push(measure.columnId);
        }
    }

    return [...new Set(ids)];
}

export function assertChartConfigUsesAnalyzableColumns(
    config: ChartConfig,
    columns: AnalysisColumn[]
): void {
    const columnsById = new Map(columns.map(column => [column.id, column]));
    const disabled = getChartConfigColumnIds(config)
        .map(columnId => columnsById.get(columnId))
        .filter(
            (column): column is AnalysisColumn =>
                column !== undefined && !column.isAnalyzable
        );

    if (disabled.length === 0) {
        return;
    }

    const firstDisabled = disabled[0]!;

    throw new ValidationError(
        disabled.map(column => column.id),
        `Column "${firstDisabled.displayName ?? firstDisabled.id}" is not included in analysis`
    );
}
