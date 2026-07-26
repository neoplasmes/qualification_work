import type { Action } from '@/core/entities/action';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';

const projector = new EntityProjector<Action>();
export const actionCodec: ReadCodec<unknown, Action> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'ref' || !result.tree.ref.startsWith('action:')) {
            throw new Error('Invalid action composition');
        }
        const row = store.get(result.tree.ref as Action['ref']);
        if (
            !row ||
            row.id === undefined ||
            row.orgId === undefined ||
            row.name === undefined ||
            row.description === undefined ||
            row.parameters === undefined ||
            row.effects === undefined ||
            row.createdAt === undefined ||
            row.updatedAt === undefined ||
            row.archivedAt === undefined
        ) {
            throw new MissingEntityError(result.tree.ref);
        }

        return projector.resolve(row, [], () => ({
            ref: row.ref,
            id: row.id!,
            orgId: row.orgId!,
            name: row.name!,
            description: row.description!,
            parameters: row.parameters!,
            effects: row.effects!,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
            archivedAt: row.archivedAt!,
        }));
    },
};
export const actionListCodec: ReadCodec<unknown, Action[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(row => actionCodec.normalize(row, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid action list');
        }

        return result.tree.children.map(tree =>
            actionCodec.resolve({ tree, refs: result.refs }, store)
        );
    },
};
