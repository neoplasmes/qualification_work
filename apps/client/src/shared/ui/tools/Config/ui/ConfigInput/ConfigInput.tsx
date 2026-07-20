import { Input } from '@qualification-work/design-system';
import type { InputHTMLAttributes } from 'react';

import { useConfigInput, type ConfigBind, type ConfigInputSource } from '../../model';

type ConfigInputReservedProps = 'defaultValue' | 'onChange' | 'value';

/**
 * Props for a text input bound to a config draft field or custom bind
 *
 * @template T - draft object shape managed by the surrounding config root
 */
export type ConfigInputProps<T extends object> = ConfigInputSource<T, string> & {
    invalid?: boolean;
    onValueChange?: (value: string) => void;
    visuallyDisabled?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, ConfigInputReservedProps>;

export const ConfigInput = <T extends object>({
    bind,
    field,
    onValueChange,
    ...props
}: ConfigInputProps<T>) => {
    const input = useConfigInput((bind ?? field) as ConfigBind<T, string>);

    return (
        <Input
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
