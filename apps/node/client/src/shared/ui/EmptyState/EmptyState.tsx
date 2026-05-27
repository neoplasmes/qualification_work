import type { HTMLAttributes, ReactNode } from 'react';

import styles from './EmptyState.module.scss';

type EmptyStateProps = {
    icon?: ReactNode;
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const EmptyState = ({ icon, className, children, ...props }: EmptyStateProps) => (
    <div
        data-stack="h"
        data-gap="sm"
        data-align="center"
        data-justify="center"
        className={[styles['empty'], className ?? ''].filter(Boolean).join(' ')}
        {...props}
    >
        {icon}
        <span>{children}</span>
    </div>
);
