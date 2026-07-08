import type {
    ChartDB as Chart,
    ColumnDataType,
    CreateChartPayload,
    UpdateChartPayload,
} from '@qualification-work/types';

export type { CreateChartPayload, UpdateChartPayload };

// Used by the compiler: contains dataset_id, data_version (for future cache keys), and column metadata.
export type ChartCompilationContext = {
    chart: Chart;
    datasetId: string;
    dataVersion: number;
    columns: Array<{
        id: string;
        key: string;
        dataType: ColumnDataType;
        isAnalyzable: boolean;
    }>;
};

export type DatasetContext = {
    datasetId: string;
    orgId: string;
    dataVersion: number;
    columns: Array<{
        id: string;
        key: string;
        dataType: ColumnDataType;
        isAnalyzable: boolean;
    }>;
};

export interface ChartRepo {
    create(data: CreateChartPayload): Promise<{ id: string }>;

    update(chartId: string, data: UpdateChartPayload): Promise<void>;

    getById(chartId: string): Promise<Chart | null>;

    getByOrgId(orgId: string): Promise<Chart[]>;

    listIdsByDatasetId(datasetId: string): Promise<string[]>;

    delete(chartId: string): Promise<void>;

    getCompilationContext(chartId: string): Promise<ChartCompilationContext | null>;

    getDatasetContext(datasetId: string): Promise<DatasetContext | null>;
}
