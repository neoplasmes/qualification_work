import type { EntityRef } from '@/core/entities/entityRef';

import type { RecordRef } from '../entityStore';
import type { ReadCodec } from '../normalize';

export interface CommandPolicy<I, O> {
    conflictKey(input: I): string;
    affected(input: I): EntityRef[];
    codec: ReadCodec<I, O>;
    removals(input: I, output: O): readonly RecordRef[];
}

export interface CommandOutcome<O> {
    data: O;
    syncError: unknown;
}

export class UncertainCommandError extends Error {
    constructor(
        cause: unknown,
        readonly syncError: unknown
    ) {
        super('The write outcome is unknown', { cause });
        this.name = 'UncertainCommandError';
    }
}
