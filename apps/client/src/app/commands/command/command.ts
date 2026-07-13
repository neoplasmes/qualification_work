import type { EntityRef } from '@/core/entities/entityRef';

export interface Command<I, O> {
    execute(input: I): Promise<O>;
    writes(input: I, output: O): EntityRef[];
}
