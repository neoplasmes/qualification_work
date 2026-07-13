export type EntityName =
    | 'user'
    | 'organization'
    | 'dataset'
    | 'datasetColumn'
    | 'datasetRow'
    | 'chart'
    | 'dashboard'
    | 'dashboardItem'
    | 'action'
    | 'actionRun'
    | 'session'
    | 'chartData'
    | 'metricPreview'
    | 'datasetTableOptions';

export type EntityRef = EntityName | `${EntityName}:${string}`;
