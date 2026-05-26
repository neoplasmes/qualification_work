import type { ReactNode } from 'react';

import styles from './FormField.module.scss';

type FormFieldProps = {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    children: ReactNode;
};

export const FormField = ({
    label,
    hint,
    error,
    className,
    children,
}: FormFieldProps) => (
    <label
        className={[styles['field'], error ? styles['error'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
    >
        <span className={styles['label']}>{label}</span>
        {children}
        {hint && <span className={styles['hint']}>{hint}</span>}
        {error && <span className={styles['error-text']}>{error}</span>}
    </label>
);
