import type { ReadCodec } from './normalize';

export function valueCodec<I, O>(): ReadCodec<I, O> {
    return {
        async normalize(output) {
            return { tree: { kind: 'value', value: output }, refs: [] };
        },
        resolve(result) {
            if (result.tree.kind !== 'value') {
                throw new Error('Invalid value composition');
            }

            return result.tree.value as O;
        },
    };
}
