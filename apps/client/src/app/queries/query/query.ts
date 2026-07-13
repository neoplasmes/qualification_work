import type { EntityRef } from '@/core/entities/entityRef';

import type { ReadOptions } from '@/app/ports/repos/readOptions';

export interface Query<I, O> {
    readonly name: string;
    execute(input: I, options?: ReadOptions): Promise<O>;
    reads(input: I): EntityRef[];
}
