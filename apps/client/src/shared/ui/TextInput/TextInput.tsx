import type { InputHTMLAttributes } from 'react';

import styles from './TextInput.module.scss';

type TextInputProps = {
    invalid?: boolean;
    visuallyDisabled?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextInput = ({
    invalid,
    visuallyDisabled,
    className,
    ...props
}: TextInputProps) => (
    <input
        className={[
            styles['input'],
            invalid ? styles['invalid'] : '',
            visuallyDisabled ? styles['disabled'] : '',
            className ?? '',
        ]
            .filter(Boolean)
            .join(' ')}
        aria-invalid={invalid || undefined}
        {...props}
    />
);
