import type { InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.scss';

type CheckboxProps = {
    label: string;
    description?: string;
    error?: string;
    className?: string;
    inline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = ({
    label,
    description,
    error,
    className,
    inline,
    ...props
}: CheckboxProps) => (
    <label
        className={[styles['root'], error ? styles['error'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
    >
        <input type="checkbox" {...props} />
        <span
            className={[styles['content'], inline ? styles['content-inline'] : '']
                .filter(Boolean)
                .join(' ')}
        >
            <span>{label}</span>
            {description && <span className={styles['description']}>{description}</span>}
            {error && <span className={styles['error-text']}>{error}</span>}
        </span>
    </label>
);
