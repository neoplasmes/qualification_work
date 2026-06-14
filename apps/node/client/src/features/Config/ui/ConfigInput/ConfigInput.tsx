import type { InputHTMLAttributes } from 'react';

import { TextInput } from '@/shared/ui';

import { useConfigInput, type ConfigBind } from '../../model';

type ConfigInputReservedProps = 'defaultValue' | 'onChange' | 'value';

export type ConfigInputProps<T extends object> = {
    bind: ConfigBind<T, string>;
    invalid?: boolean;
    visuallyDisabled?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, ConfigInputReservedProps>;

export const ConfigInput = <T extends object>({
    bind,
    ...props
}: ConfigInputProps<T>) => {
    const input = useConfigInput(bind);

    return (
        <TextInput
            {...props}
            value={input.value}
            onChange={event => input.setValue(event.currentTarget.value)}
        />
    );
};
