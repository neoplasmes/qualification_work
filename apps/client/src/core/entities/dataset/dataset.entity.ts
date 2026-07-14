import type { DatasetSourceType } from '@qualification-work/types';

import type { Entity } from '../entity';

export interface Dataset extends Entity {
    readonly ref: `dataset:${string}`;
    id: string;
    orgId: string;
    name: string;
    sourceType: DatasetSourceType;
    createdAt: string;
    updatedAt: string;
}
