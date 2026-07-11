import { createElement } from 'react';
import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './link.module.css';

export type LinkProps<E extends ElementType = 'a'> = {
    as?: E;
    variant?: 'normal' | 'quiet' | 'danger';
    block?: boolean;
} & Omit<ComponentPropsWithRef<E>, 'as'>;

export function Link<E extends ElementType = 'a'>({ as, variant = 'normal', block, className, ...props }: LinkProps<E>) {
    return createElement(as ?? 'a', { ...props, className: `${styles.link} ${styles[variant]}${block ? ` ${styles.block}` : ''}${className ? ` ${className}` : ''}` });
}
