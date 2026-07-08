import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import styles from './Tooltip.module.scss';

export type TooltipProps = {
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
    ({ className, children, role = 'tooltip', ...props }, ref) => (
        <div
            ref={ref}
            className={[styles['tooltip'], className ?? ''].filter(Boolean).join(' ')}
            role={role}
            {...props}
        >
            {children}
        </div>
    )
);

Tooltip.displayName = 'Tooltip';
