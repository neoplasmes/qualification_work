import type { ReactNode, SelectHTMLAttributes } from 'react';

import { Select } from '@/shared/ui';

import { useConfigInput, type ConfigBind } from '../../model';

type ConfigSelectReservedProps = 'children' | 'defaultValue' | 'onChange' | 'value';

export type ConfigSelectOption<V extends string> = {
    value: V;
    label: ReactNode;
    disabled?: boolean;
};

export type ConfigSelectProps<T extends object, V extends string> = {
    bind: ConfigBind<T, V>;
    children?: ReactNode;
    invalid?: boolean;
    options?: readonly ConfigSelectOption<V>[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, ConfigSelectReservedProps>;

export const ConfigSelect = <T extends object, V extends string>({
    bind,
    children,
    options,
    ...props
}: ConfigSelectProps<T, V>) => {
    const input = useConfigInput(bind);
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
