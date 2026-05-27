import type { LabelHTMLAttributes, ReactNode } from 'react';

import styles from './FormField.module.scss';

type FormFieldProps = {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    children: ReactNode;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'>;

export const FormField = ({
    label,
    hint,
    error,
    className,
    children,
    'data-display': dataDisplay,
    'data-gap': dataGap,
    'data-stack': dataStack,
    ...props
}: FormFieldProps) => (
    <label
        data-display={dataStack ? dataDisplay : (dataDisplay ?? 'grid')}
        data-gap={dataGap ?? 'xs'}
        data-stack={dataStack}
        className={[error ? styles['error'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    >
        <span className={styles['label']}>{label}</span>
        {children}
        {hint && <span className={styles['hint']}>{hint}</span>}
        {error && <span className={styles['error-text']}>{error}</span>}
    </label>
);
