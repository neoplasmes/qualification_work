import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import type { StagingStore } from '@/env/cache/entityStore';
import {
    EntityProjector,
    MissingEntityError,
    type CompositionNode,
    type ReadCodec,
} from '@/env/cache/normalize';

const columnProjector = new EntityProjector<DatasetColumn>();
const rowProjector = new EntityProjector<DatasetRow>();

export function resolveColumn(node: CompositionNode, store: StagingStore): DatasetColumn {
    if (node.kind !== 'ref' || !node.ref.startsWith('datasetColumn:')) {
        throw new Error('Invalid column composition');
    }
    const row = store.get(node.ref as DatasetColumn['ref']);
    if (
        !row ||
        typeof row.id !== 'string' ||
        typeof row.datasetId !== 'string' ||
        typeof row.key !== 'string' ||
        typeof row.displayName !== 'string' ||
        !row.dataType ||
        typeof row.orderIndex !== 'number' ||
        typeof row.isAnalyzable !== 'boolean'
    ) {
        throw new MissingEntityError(node.ref);
    }

    return columnProjector.resolve(row, [], () => ({
        ref: row.ref,
        id: row.id!,
        datasetId: row.datasetId!,
        key: row.key!,
        displayName: row.displayName!,
        dataType: row.dataType!,
        orderIndex: row.orderIndex!,
        isAnalyzable: row.isAnalyzable!,
    }));
}
export function resolveRow(node: CompositionNode, store: StagingStore): DatasetRow {
    if (node.kind !== 'ref' || !node.ref.startsWith('datasetRow:')) {
        throw new Error('Invalid row composition');
    }
    const row = store.get(node.ref as DatasetRow['ref']);
    if (
        !row ||
        typeof row.id !== 'string' ||
        typeof row.datasetId !== 'string' ||
        typeof row.rowIndex !== 'number' ||
        !row.data ||
        typeof row.data !== 'object'
    ) {
        throw new MissingEntityError(node.ref);
    }

    return rowProjector.resolve(row, [], () => ({
        ref: row.ref,
        id: row.id!,
        datasetId: row.datasetId!,
        rowIndex: row.rowIndex!,
        data: row.data!,
    }));
}

export const datasetColumnCodec: ReadCodec<unknown, DatasetColumn> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve: (result, store) => resolveColumn(result.tree, store),
};
export const datasetRowCodec: ReadCodec<unknown, DatasetRow> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve: (result, store) => resolveRow(result.tree, store),
};
export const datasetRowListCodec: ReadCodec<unknown, DatasetRow[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(row => datasetRowCodec.normalize(row, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid rows composition');
        }

        return result.tree.children.map(node => resolveRow(node, store));
    },
};
