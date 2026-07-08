import type { SelectHTMLAttributes } from 'react';

import styles from './Select.module.scss';

type SelectProps = {
    invalid?: boolean;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ invalid, className, ...props }: SelectProps) => (
    <select
        className={[styles['select'], invalid ? styles['invalid'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        aria-invalid={invalid || undefined}
        {...props}
    />
);
