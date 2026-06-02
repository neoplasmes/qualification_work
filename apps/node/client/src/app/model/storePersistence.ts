export type PersistedSliceDescriptor<State, PersistedState extends object> = {
    key: string;
    fallbackState: PersistedState;
    getInitialState: (persistedState: PersistedState) => State;
    pickPersistedState: (state: State) => PersistedState;
};

export type PersistedSliceSubscription<RootState> = {
    key: string;
    selectPersistedState: (state: RootState) => object;
};

type StoreWithState<RootState> = {
    getState: () => RootState;
    subscribe: (listener: () => void) => () => void;
};

export const loadPersistedState = <PersistedState extends object>(
    key: string,
    fallbackState: PersistedState
): PersistedState => {
    try {
        const raw = localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as PersistedState) : fallbackState;
    } catch {
        return fallbackState;
    }
};

export const getPersistedInitialState = <State, PersistedState extends object>(
    descriptor: PersistedSliceDescriptor<State, PersistedState>
): State =>
    descriptor.getInitialState(
        loadPersistedState(descriptor.key, descriptor.fallbackState)
    );

export const clearPersistedState = (keys: readonly string[]) => {
    try {
        keys.forEach(key => localStorage.removeItem(key));
    } catch {
        // ignore storage access errors
    }
};

const hasPersistedStateChanged = (prevState: object, nextState: object) => {
    const prevRecord = prevState as Record<string, unknown>;
    const nextRecord = nextState as Record<string, unknown>;
    const prevKeys = Object.keys(prevRecord);
    const nextKeys = Object.keys(nextRecord);

    return (
        prevKeys.length !== nextKeys.length ||
        nextKeys.some(key => nextRecord[key] !== prevRecord[key])
    );
};

const savePersistedState = (key: string, state: object) => {
    try {
        localStorage.setItem(key, JSON.stringify(state));
    } catch {
        // ignore storage quota errors
    }
};

export const subscribePersistedSlices = <RootState>(
    store: StoreWithState<RootState>,
    descriptors: readonly PersistedSliceSubscription<RootState>[]
) => {
    const snapshots = descriptors.map(descriptor => ({
        descriptor,
        state: descriptor.selectPersistedState(store.getState()),
    }));

    return store.subscribe(() => {
        const rootState = store.getState();

        snapshots.forEach(snapshot => {
            const nextState = snapshot.descriptor.selectPersistedState(rootState);

            if (!hasPersistedStateChanged(snapshot.state, nextState)) {
                return;
            }

            snapshot.state = nextState;
            savePersistedState(snapshot.descriptor.key, nextState);
        });
    });
};
