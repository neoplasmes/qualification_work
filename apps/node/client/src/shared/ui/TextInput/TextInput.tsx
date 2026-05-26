import type { InputHTMLAttributes } from 'react';

import styles from './TextInput.module.scss';

type TextInputProps = {
    invalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextInput = ({ invalid, className, ...props }: TextInputProps) => (
    <input
        className={[styles['input'], invalid ? styles['invalid'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        aria-invalid={invalid || undefined}
        {...props}
    />
);
