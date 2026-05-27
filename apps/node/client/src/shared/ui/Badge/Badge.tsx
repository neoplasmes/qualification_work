import type { HTMLAttributes, ReactNode } from 'react';

import styles from './Badge.module.scss';

type BadgeProps = {
    tone?: 'default' | 'success' | 'danger' | 'primary';
    children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export const Badge = ({
    tone = 'default',
    className,
    children,
    ...props
}: BadgeProps) => (
    <span
        data-display="inline-flex"
        data-align="center"
        data-justify="center"
        className={[styles['badge'], styles[tone], className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    >
        {children}
    </span>
);
