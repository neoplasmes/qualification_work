import type { Chart } from '@/core/entities/chart';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';

const projector = new EntityProjector<Chart>();

export const chartCodec: ReadCodec<unknown, Chart> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'ref' || !result.tree.ref.startsWith('chart:')) {
            throw new Error('Invalid chart composition');
        }
        const row = store.get(result.tree.ref as Chart['ref']);
        if (
            !row ||
            typeof row.id !== 'string' ||
            typeof row.orgId !== 'string' ||
            typeof row.datasetId !== 'string' ||
            typeof row.name !== 'string' ||
            !row.chartType ||
            !row.config ||
            typeof row.createdAt !== 'string' ||
            typeof row.updatedAt !== 'string'
        ) {
            throw new MissingEntityError(result.tree.ref);
        }

        return projector.resolve(row, [], () => ({
            ref: row.ref,
            id: row.id!,
            orgId: row.orgId!,
            datasetId: row.datasetId!,
            name: row.name!,
            chartType: row.chartType!,
            config: row.config!,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
        }));
    },
};
export const chartListCodec: ReadCodec<unknown, Chart[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(chart => chartCodec.normalize(chart, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid chart list');
        }

        return result.tree.children.map(tree =>
            chartCodec.resolve({ tree, refs: result.refs }, store)
        );
    },
};
