import type { ColumnDataType } from '@qualification-work/types';

import type { Entity } from '../entity';

export interface DatasetColumn extends Entity {
    readonly ref: `datasetColumn:${string}`;
    id: string;
    datasetId: string;
    key: string;
    displayName: string;
    dataType: ColumnDataType;
    orderIndex: number;
    isAnalyzable: boolean;
}
