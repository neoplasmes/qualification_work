import type { EntityStore, RecordRef } from '../entityStore';
import type { NormalizedResult } from './normalize';

export function compositionRefs(
    result: NormalizedResult,
    store: EntityStore
): RecordRef[] {
    const refs = new Set(
        result.refs.filter(
            (ref): ref is RecordRef =>
                ref.includes(':') &&
                ![
                    'session',
                    'chartData',
                    'metricPreview',
                    'datasetTableOptions',
                ].includes(ref.split(':')[0]!)
        )
    );
    const nodes = [result.tree];
    while (nodes.length) {
        const node = nodes.pop()!;
        if (node.kind === 'ref') {
            refs.add(node.ref);
        }
        if (node.kind === 'array') {
            nodes.push(...node.children);
        }
        if (node.kind === 'object') {
            nodes.push(...Object.values(node.children));
        }
    }
    const pending = [...refs];
    while (pending.length) {
        for (const child of store.references(pending.pop()!)) {
            if (!refs.has(child)) {
                refs.add(child);
                pending.push(child);
            }
        }
    }

    return [...refs];
}
