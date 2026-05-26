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
        className={[styles['badge'], styles[tone], className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    >
        {children}
    </span>
);
