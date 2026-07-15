import type { EntityRef } from '@/core/entities/entityRef';

import type { RecordRef, StagingStore } from '../entityStore';

export type CompositionNode =
    | { kind: 'ref'; ref: RecordRef }
    | { kind: 'value'; value: unknown }
    | { kind: 'array'; children: readonly CompositionNode[] }
    | { kind: 'object'; children: Readonly<Record<string, CompositionNode>> };

export interface NormalizedResult {
    tree: CompositionNode;
    refs: readonly EntityRef[];
}

export interface ReadCodec<I, O> {
    normalize(output: O, input: I, store: StagingStore): Promise<NormalizedResult>;
    resolve(result: NormalizedResult, store: StagingStore): O;
}

export class MissingEntityError extends Error {
    constructor(readonly ref: EntityRef) {
        super(`Missing or incomplete entity: ${ref}`);
        this.name = 'MissingEntityError';
    }
}
