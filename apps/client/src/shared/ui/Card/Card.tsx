import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './Card.module.scss';

type CardProps<T extends ElementType = 'div'> = {
    as?: T;
    children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export const Card = <T extends ElementType = 'div'>({
    as,
    className,
    children,
    ...props
}: CardProps<T>) => {
    const Component = as ?? 'div';

    return (
        <Component
            className={[styles['card'], className ?? ''].filter(Boolean).join(' ')}
            {...props}
        >
            {children}
        </Component>
    );
};
