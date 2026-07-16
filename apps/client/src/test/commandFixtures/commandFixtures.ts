import type { CommandPolicy } from '@/env/cache/commandPolicy';
import { datasetFixture } from '@/test/cacheFixtures';

import type { Command } from '@/app/commands/command';

export function commandPolicy<I, O>(): CommandPolicy<I, O> {
    return {
        conflictKey: () => 'orgData:org-1',
        affected: () => [datasetFixture.ref],
        codec: {
            async normalize(value) {
                return { tree: { kind: 'value', value }, refs: [] };
            },
            resolve(result) {
                if (result.tree.kind !== 'value') {
                    throw new Error('Expected value');
                }

                return result.tree.value as O;
            },
        },
        removals: () => [],
    };
}

export function createCommand<I, O>(execute: Command<I, O>['execute']): Command<I, O> {
    return { execute, writes: () => [datasetFixture.ref] };
}
