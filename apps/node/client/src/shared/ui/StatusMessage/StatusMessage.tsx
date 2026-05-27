import type { HTMLAttributes, ReactNode } from 'react';

import styles from './StatusMessage.module.scss';

type StatusMessageProps = {
    tone?: 'neutral' | 'error' | 'success';
    centered?: boolean;
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const StatusMessage = ({
    tone = 'neutral',
    centered = false,
    className,
    children,
    ...props
}: StatusMessageProps) => (
    <div
        role={tone === 'error' ? 'alert' : props.role}
        data-stack={centered ? 'h' : undefined}
        data-align={centered ? 'center' : undefined}
        data-justify={centered ? 'center' : undefined}
        data-px="md"
        data-py="sm"
        className={[
            styles['status'],
            styles[tone],
            centered ? styles['centered'] : '',
            className ?? '',
        ]
            .filter(Boolean)
            .join(' ')}
        {...props}
    >
        {children}
    </div>
);
