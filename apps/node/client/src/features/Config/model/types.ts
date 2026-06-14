/**
 * a value or a function that creates the next value
 *
 * @export
 * @template T - value type
 */
export type ConfigSetter<T> = T | ((current: T) => T);

/**
 * a function that changes a draft object in place
 *
 * @export
 * @template T - draft object type
 */
export type ConfigMutator<T extends object> = (draft: T) => void;

/**
 * select/dispatch analog
 *
 * @export
 * @template T - draft object type
 * @template V - value type
 */
export type ConfigBind<T extends object, V> = {
    /** selector */
    get: (draft: T) => V;
    /**
     * in-place dispatcher
     *
     * @param draft
     * @param value
     * @returns
     */
    set: (draft: T, value: V) => void;
};

/**
 * state/setState analog
 *
 * @export
 * @template V - value type
 */
export type ConfigBinding<V> = {
    value: V;
    setValue: (next: ConfigSetter<V>) => void;
};

/**
 * a function that prepares the config to be sent outside of Config store
 *
 * @export
 * @template T - draft object type
 * @template O - output object type
 */
export type ConfigToOutput<T extends object, O> = (normalizedDraft: T, draft: T) => O;

/**
 * Current config state and functions to manage it
 *
 * @export
 * @template T - draft object type
 * @template O - output object type
 */
export type ConfigSnapshot<T extends object, O> = {
    draft: T;
    output: O;
    setDraft: (next: ConfigSetter<T>) => void;
    mutateDraft: (mutator: ConfigMutator<T>) => void;
    getValue: <V>(bind: ConfigBind<T, V>) => V;
    setValue: <V>(bind: ConfigBind<T, V>, next: ConfigSetter<V>) => void;
};

/**
 * a rule that changes output when a section is disabled
 *
 * @export
 * @template T - draft object type
 */
export type DisabledOutputRule<T extends object> = {
    id: string;
    enabled: boolean;
    apply: ConfigMutator<T>;
};
