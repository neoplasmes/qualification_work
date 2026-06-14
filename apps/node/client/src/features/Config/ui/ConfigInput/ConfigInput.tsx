import type { InputHTMLAttributes } from 'react';

import { TextInput } from '@/shared/ui';

import { useConfigInput, type ConfigBind } from '../../model';

type ConfigInputReservedProps = 'defaultValue' | 'onChange' | 'value';

export type ConfigInputProps<T extends object> = {
    bind: ConfigBind<T, string>;
    invalid?: boolean;
    onValueChange?: (value: string) => void;
    visuallyDisabled?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, ConfigInputReservedProps>;

export const ConfigInput = <T extends object>({
    bind,
    onValueChange,
    ...props
}: ConfigInputProps<T>) => {
    const input = useConfigInput(bind);

    return (
        <TextInput
            {...props}
            value={input.value}
            onChange={event => {
                const nextValue = event.currentTarget.value;

                input.setValue(nextValue);
                onValueChange?.(nextValue);
            }}
        />
    );
};
