import type { ActionRun } from '@/core/entities/actionRun';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';

const projector = new EntityProjector<ActionRun>();
export const actionRunCodec: ReadCodec<unknown, ActionRun> = {
    async normalize(output, _input, store) {
        await store.upsert(output.ref, output);

        return { tree: { kind: 'ref', ref: output.ref }, refs: [output.ref] };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'ref' || !result.tree.ref.startsWith('actionRun:')) {
            throw new Error('Invalid actionRun composition');
        }
        const row = store.get(result.tree.ref as ActionRun['ref']);
        if (
            !row ||
            row.id === undefined ||
            row.orgId === undefined ||
            row.actionId === undefined ||
            row.userId === undefined ||
            row.parameters === undefined ||
            row.changes === undefined ||
            row.status === undefined ||
            row.errorMessage === undefined ||
            row.executedAt === undefined
        ) {
            throw new MissingEntityError(result.tree.ref);
        }

        return projector.resolve(row, [], () => ({
            ref: row.ref,
            id: row.id!,
            orgId: row.orgId!,
            actionId: row.actionId!,
            userId: row.userId!,
            parameters: row.parameters!,
            changes: row.changes!,
            status: row.status!,
            errorMessage: row.errorMessage!,
            executedAt: row.executedAt!,
        }));
    },
};
export const actionRunListCodec: ReadCodec<unknown, ActionRun[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(row => actionRunCodec.normalize(row, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid actionRun list');
        }

        return result.tree.children.map(tree =>
            actionRunCodec.resolve({ tree, refs: result.refs }, store)
        );
    },
};
