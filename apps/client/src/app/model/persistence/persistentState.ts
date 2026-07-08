import type { EnhancedStore } from '@reduxjs/toolkit';

/**
 * A set of rules, describing how to work with a specific slice
 * in the scope of persistence
 *
 * @export
 * @template S - original state of concrete slice
 * @template P - persisted state of concrete slice
 */
export type PersistedSliceDescriptor<S, P extends Record<string, unknown>> = {
    /** key in local storage to save */
    key: string;
    /** literally a fallback state */
    fallbackState: P;
    /** function to extract persisted data to actual state */
    getInitialState: (persistedState: P) => S;
    /** function to extract actual data to persisted state (which part of slice to save) */
    pickPersistedState: (state: S) => P;
};

/**
 * Description placeholder
 *
 * @export
 * @template S - the whole redux store state
 */
export type PersistedSliceSubscription<S> = {
    key: string;
    selectPersistedState: (state: S) => Record<string, unknown>;
};

// TODO: optimize this *****************
export class PersistentStateStorage {
    constructor(
        private readonly storageType: Exclude<
            {
                [K in keyof Window]: Window[K] extends Storage ? K : never;
            }[keyof Window],
            undefined
        >
    ) {}

    load<P extends object>(key: string, fallbackState: P): P {
        try {
            const raw = this.getStorage().getItem(key);

            return raw ? (JSON.parse(raw) as P) : fallbackState;
        } catch {
            return fallbackState;
        }
    }

    getInitialState<S, P extends Record<string, unknown>>(
        descriptor: PersistedSliceDescriptor<S, P>
    ): S {
        return descriptor.getInitialState(
            this.load(descriptor.key, descriptor.fallbackState)
        );
    }

    clear(keys: readonly string[]) {
        keys.forEach(key => this.getStorage().removeItem(key));
    }

    subscribeSlices<S>(
        store: Pick<EnhancedStore<S>, 'getState' | 'subscribe'>,
        subscribtions: readonly PersistedSliceSubscription<S>[]
    ) {
        /** remembered values */
        const prev = subscribtions.map(sub => ({
            sub,
            state: sub.selectPersistedState(store.getState()),
        }));

        return store.subscribe(() => {
            const rootState = store.getState();

            prev.forEach(p => {
                const nextState = p.sub.selectPersistedState(rootState);

                const prevKeys = Object.keys(p.state);
                const nextKeys = Object.keys(nextState);

                const hasChanged =
                    prevKeys.length !== nextKeys.length ||
                    nextKeys.some(key => nextState[key] !== p.state[key]);

                if (!hasChanged) {
                    return;
                }

                p.state = nextState;

                this.save(p.sub.key, nextState);
            });
        });
    }

    private getStorage() {
        return globalThis[this.storageType];
    }

    private save(key: string, state: object) {
        try {
            this.getStorage().setItem(key, JSON.stringify(state));
        } catch {
            // ignore storage quota errors
        }
    }
}

export const persistentStateStorage = new PersistentStateStorage('localStorage');
