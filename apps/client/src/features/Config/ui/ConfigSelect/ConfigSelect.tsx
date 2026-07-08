import type { ReactNode, SelectHTMLAttributes } from 'react';

import { Select } from '@/shared/ui';

import { useConfigInput, type ConfigBind, type ConfigInputSource } from '../../model';

type ConfigSelectReservedProps = 'children' | 'defaultValue' | 'onChange' | 'value';

/**
 * Option descriptor for config select inputs
 *
 * @template V - string literal value accepted by the select input
 */
export type ConfigSelectOption<V extends string> = {
    value: V;
    label: ReactNode;
    disabled?: boolean;
};

/**
 * Props for a select input bound to a config draft field or custom bind
 *
 * @template T - draft object shape managed by the surrounding config root
 * @template V - string literal value accepted by the select input
 */
export type ConfigSelectProps<T extends object, V extends string> = ConfigInputSource<
    T,
    V
> & {
    children?: ReactNode;
    invalid?: boolean;
    options?: readonly ConfigSelectOption<V>[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, ConfigSelectReservedProps>;

export const ConfigSelect = <T extends object, V extends string>({
    bind,
    field,
    children,
    options,
    ...props
}: ConfigSelectProps<T, V>) => {
    const input = useConfigInput((bind ?? field) as ConfigBind<T, V>);
    const content =
        children ??
        options?.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
            </option>
        ));

    return (
        <Select
            {...props}
            value={input.value}
            onChange={event => input.setValue(event.currentTarget.value as V)}
        >
            {content}
        </Select>
    );
};
