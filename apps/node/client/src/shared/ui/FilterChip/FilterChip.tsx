import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './FilterChip.module.scss';

type FilterChipProps = {
    label: ReactNode;
    meta?: ReactNode;
    selected?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const FilterChip = ({
    label,
    meta,
    selected = false,
    className,
    type = 'button',
    ...props
}: FilterChipProps) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={[styles['chip'], selected ? styles['selected'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        aria-pressed={selected}
        {...props}
    >
        <div className={styles['name']}>{label}</div>
        {meta && <div className={styles['meta']}>{meta}</div>}
    </button>
);
