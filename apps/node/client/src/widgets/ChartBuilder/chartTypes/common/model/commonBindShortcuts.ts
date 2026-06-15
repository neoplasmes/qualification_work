import type { ConfigBind, ConfigFieldKey } from '@/features/Config';

/**
 * connects Config controls to a plain draft field
 *
 * @template T draft shape used by the chart settings
 * @template K field name inside the draft
 */
export const createChartTypeBind = <T extends object, K extends keyof T>(
    key: K
): ConfigBind<T, T[K]> => ({
    get: draft => draft[key],
    set: (draft, value) => {
        draft[key] = value;
    },
});

/**
 * adapts a boolean draft value to a select-friendly state
 *
 * @template T draft shape used by the chart settings
 */
export const createBooleanSelectBind = <T extends object>(
    bind: ConfigBind<T, boolean>
): ConfigBind<T, 'on' | 'off'> => ({
    get: draft => (bind.get(draft) ? 'on' : 'off'),
    set: (draft, value) => {
        bind.set(draft, value === 'on');
    },
});

/**
 * keeps numeric draft fields editable through text inputs
 *
 * @template T draft shape used by the chart settings
 * @template K numeric field name inside the draft
 */
export const createNumberInputBind = <T extends object, K extends keyof T>(
    key: K,
    normalize: (value: number) => number
): ConfigBind<T, string> => ({
    get: draft => String(draft[key] ?? ''),
    set: (draft, value) => {
        (draft[key] as number) = normalize(Number(value));
    },
});

/**
 * prefers the currently available analysis column while keeping the draft stable
 *
 * @template T draft shape used by the chart settings
 */
export const createActiveStringBind = <T extends object>(
    key: ConfigFieldKey<T, string>,
    activeValue: string
): ConfigBind<T, string> => ({
    get: draft => activeValue || (draft[key] as string),
    set: (draft, value) => {
        draft[key] = value as T[typeof key];
    },
});
