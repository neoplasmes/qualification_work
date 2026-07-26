import type { Dashboard } from '@/core/entities/dashboard';
import type { DashboardItem } from '@/core/entities/dashboardItem';
import {
    EntityProjector,
    MissingEntityError,
    type ReadCodec,
} from '@/env/cache/normalize';

const dashboardProjector = new EntityProjector<Dashboard>();
const itemProjector = new EntityProjector<DashboardItem>();

export const dashboardCodec: ReadCodec<unknown, Dashboard> = {
    async normalize(output, _input, store) {
        for (const item of output.items) {
            await store.upsert(item.ref, item);
        }
        await store.upsert(output.ref, {
            ...output,
            items: output.items.map(item => item.ref),
        });

        return {
            tree: { kind: 'ref', ref: output.ref },
            refs: [output.ref, ...output.items.map(item => item.ref)],
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'ref' || !result.tree.ref.startsWith('dashboard:')) {
            throw new Error('Invalid dashboard composition');
        }
        const row = store.get(result.tree.ref as Dashboard['ref']);
        if (
            !row ||
            typeof row.id !== 'string' ||
            typeof row.orgId !== 'string' ||
            typeof row.name !== 'string' ||
            !row.items ||
            typeof row.createdAt !== 'string' ||
            typeof row.updatedAt !== 'string'
        ) {
            throw new MissingEntityError(result.tree.ref);
        }
        const items = row.items.map(ref => {
            const item = store.get(ref);
            if (!item || typeof item.id !== 'string' || !item.layout || !item.kind) {
                throw new MissingEntityError(ref);
            }
            if (item.kind === 'chart') {
                if (typeof item.chartId !== 'string') {
                    throw new MissingEntityError(ref);
                }

                return itemProjector.resolve(item, [], () => ({
                    ref,
                    id: item.id!,
                    layout: item.layout!,
                    kind: 'chart',
                    chartId: item.chartId!,
                }));
            }
            if (item.kind !== 'metric') {
                throw new MissingEntityError(ref);
            }
            if (
                typeof item.datasetId !== 'string' ||
                typeof item.name !== 'string' ||
                typeof item.expression !== 'string' ||
                typeof item.format !== 'string' ||
                typeof item.valueMultiplier !== 'number' ||
                item.target === undefined ||
                item.targetDirection === undefined ||
                typeof item.showTrend !== 'boolean' ||
                item.timeColumn === undefined ||
                item.timeBucket === undefined
            ) {
                throw new MissingEntityError(ref);
            }

            return itemProjector.resolve(item, [], () => ({
                ref,
                id: item.id!,
                layout: item.layout!,
                kind: 'metric',
                datasetId: item.datasetId!,
                name: item.name!,
                expression: item.expression!,
                format: item.format!,
                valueMultiplier: item.valueMultiplier!,
                target: item.target!,
                targetDirection: item.targetDirection!,
                showTrend: item.showTrend!,
                timeColumn: item.timeColumn!,
                timeBucket: item.timeBucket!,
                ...('value' in item ? { value: item.value } : {}),
                ...('trend' in item ? { trend: item.trend } : {}),
            }));
        });

        return dashboardProjector.resolve(row, items, () => ({
            ref: row.ref,
            id: row.id!,
            orgId: row.orgId!,
            name: row.name!,
            items,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
        }));
    },
};
export const dashboardListCodec: ReadCodec<unknown, Dashboard[]> = {
    async normalize(output, input, store) {
        const results = await Promise.all(
            output.map(item => dashboardCodec.normalize(item, input, store))
        );

        return {
            tree: { kind: 'array', children: results.map(result => result.tree) },
            refs: results.flatMap(result => result.refs),
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'array') {
            throw new Error('Invalid dashboard list');
        }

        return result.tree.children.map(tree =>
            dashboardCodec.resolve({ tree, refs: result.refs }, store)
        );
    },
};
