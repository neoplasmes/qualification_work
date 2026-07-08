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
 * Name of a draft field whose value is assignable to the requested value type
 *
 * @template T - draft object shape
 * @template V - field value type
 */
export type ConfigFieldKey<T extends object, V> = Extract<
    {
        [K in keyof T]-?: T[K] extends V ? K : never;
    }[keyof T],
    string
>;

/**
 * Input source can be a direct draft field or a custom bind adapter
 *
 * @template T - draft object shape
 * @template V - input value type
 */
export type ConfigInputSource<T extends object, V> =
    | {
          bind: ConfigBind<T, V>;
          field?: never;
      }
    | {
          field: ConfigFieldKey<T, V>;
          bind?: never;
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
 * Current config state and functions to manage it
 *
 * @export
 * @template T - draft object type
 */
export type ConfigSnapshot<T extends object> = {
    draft: T;
    setDraft: (next: ConfigSetter<T>) => void;
    mutateDraft: (mutator: ConfigMutator<T>) => void;
    getValue: <V>(bind: ConfigBind<T, V>) => V;
    setValue: <V>(bind: ConfigBind<T, V>, next: ConfigSetter<V>) => void;
};
