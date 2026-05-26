import type { HTMLAttributes, ReactNode } from 'react';

import styles from './SelectableList.module.scss';

type SelectableListProps = {
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const SelectableList = ({
    className,
    children,
    ...props
}: SelectableListProps) => (
    <div
        className={[styles['list'], className ?? ''].filter(Boolean).join(' ')}
        {...props}
    >
        {children}
    </div>
);
