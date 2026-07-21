import type { Dataset } from '@/core/entities/dataset';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';

import type { DatasetMetadata, DatasetRowsPage } from '@/app/ports/repos/dataset';

import { datasetRowListCodec, resolveColumn } from './datasetEntities';

const datasetProjector = new EntityProjector<Dataset>();

export const datasetMetadataCodec: ReadCodec<unknown, DatasetMetadata> = {
    async normalize(output, _input, store) {
        await store.upsert(output.dataset.ref, output.dataset);
        for (const column of output.columns) {
            await store.upsert(column.ref, column);
        }

        return {
            tree: {
                kind: 'object',
                children: {
                    dataset: { kind: 'ref', ref: output.dataset.ref },
                    columns: {
                        kind: 'array',
                        children: output.columns.map(column => ({
                            kind: 'ref',
                            ref: column.ref,
                        })),
                    },
                    totalRows: { kind: 'value', value: output.totalRows },
                },
            },
            refs: [output.dataset.ref, ...output.columns.map(column => column.ref)],
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'object') {
            throw new Error('Invalid metadata composition');
        }
        const { dataset, columns, totalRows } = result.tree.children;
        if (
            !dataset ||
            columns?.kind !== 'array' ||
            totalRows?.kind !== 'value' ||
            typeof totalRows.value !== 'number'
        ) {
            throw new Error('Invalid metadata envelope');
        }

        if (dataset.kind !== 'ref' || !dataset.ref.startsWith('dataset:')) {
            throw new Error('Invalid dataset composition');
        }
        const row = store.get(dataset.ref as Dataset['ref']);
        if (
            !row ||
            typeof row.id !== 'string' ||
            typeof row.orgId !== 'string' ||
            typeof row.name !== 'string' ||
            !row.sourceType ||
            typeof row.createdAt !== 'string' ||
            typeof row.updatedAt !== 'string'
        ) {
            throw new MissingEntityError(dataset.ref);
        }

        return {
            dataset: datasetProjector.resolve(row, [], () => ({
                ref: row.ref,
                id: row.id!,
                orgId: row.orgId!,
                name: row.name!,
                sourceType: row.sourceType!,
                createdAt: row.createdAt!,
                updatedAt: row.updatedAt!,
            })),
            columns: columns.children.map(column => resolveColumn(column, store)),
            totalRows: totalRows.value,
        };
    },
};
export const datasetListCodec: ReadCodec<unknown, DatasetMetadata[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(item => datasetMetadataCodec.normalize(item, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid dataset list');
        }

        return result.tree.children.map(tree =>
            datasetMetadataCodec.resolve({ tree, refs: result.refs }, store)
        );
    },
};
export const datasetRowsCodec: ReadCodec<unknown, DatasetRowsPage> = {
    async normalize(output, input, store) {
        const rows = await datasetRowListCodec.normalize(output.rows, input, store);

        return {
            tree: {
                kind: 'object',
                children: {
                    rows: rows.tree,
                    totalRows: { kind: 'value', value: output.totalRows },
                    offset: { kind: 'value', value: output.offset },
                    limit: { kind: 'value', value: output.limit },
                },
            },
            refs: rows.refs,
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'object') {
            throw new Error('Invalid rows page');
        }
        const { rows, totalRows, offset, limit } = result.tree.children;
        if (
            !rows ||
            totalRows?.kind !== 'value' ||
            typeof totalRows.value !== 'number' ||
            offset?.kind !== 'value' ||
            typeof offset.value !== 'number' ||
            limit?.kind !== 'value' ||
            typeof limit.value !== 'number'
        ) {
            throw new Error('Invalid rows envelope');
        }

        return {
            rows: datasetRowListCodec.resolve({ tree: rows, refs: result.refs }, store),
            totalRows: totalRows.value,
            offset: offset.value,
            limit: limit.value,
        };
    },
};
