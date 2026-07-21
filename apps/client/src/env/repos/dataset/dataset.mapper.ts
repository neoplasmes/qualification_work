import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import { ContractViolationError } from '@/env/transport/http';
import type { z } from 'zod';

import type {
    DatasetMetadata,
    DatasetScope,
    ListDatasetsInput,
} from '@/app/ports/repos/dataset';

import type { columnSchema, metadataSchema, rowSchema } from './dataset.schema';

export function mapColumn(
    dto: z.infer<typeof columnSchema>,
    input: DatasetScope
): DatasetColumn {
    if (dto.datasetId !== input.datasetId) {
        throw new ContractViolationError('Unexpected column dataset');
    }

    return {
        ...dto,
        ref: `datasetColumn:${encodeURIComponent(input.orgId)}/${encodeURIComponent(dto.datasetId)}/${encodeURIComponent(dto.id)}`,
    };
}
export function mapRow(dto: z.infer<typeof rowSchema>, input: DatasetScope): DatasetRow {
    if (dto.datasetId !== input.datasetId) {
        throw new ContractViolationError('Unexpected row dataset');
    }

    return {
        ...dto,
        ref: `datasetRow:${encodeURIComponent(input.orgId)}/${encodeURIComponent(dto.datasetId)}/${encodeURIComponent(dto.id)}`,
    };
}
export function mapMetadata(
    dto: z.infer<typeof metadataSchema>,
    input: ListDatasetsInput & { datasetId?: string }
): DatasetMetadata {
    if (
        dto.dataset.orgId !== input.orgId ||
        (input.datasetId !== undefined && dto.dataset.id !== input.datasetId)
    ) {
        throw new ContractViolationError('Unexpected dataset scope');
    }

    return {
        dataset: {
            ...dto.dataset,
            ref: `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(dto.dataset.id)}`,
        },
        columns: dto.columns.map(column =>
            mapColumn(column, { orgId: input.orgId, datasetId: dto.dataset.id })
        ),
        totalRows: dto.totalRows,
    };
}
