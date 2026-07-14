import type { Entity } from '../entity';

export interface DatasetRow extends Entity {
    readonly ref: `datasetRow:${string}`;
    id: string;
    datasetId: string;
    rowIndex: number;
    data: Record<string, unknown>;
}
