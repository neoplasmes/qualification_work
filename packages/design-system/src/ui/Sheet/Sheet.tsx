import { createElement } from 'react';
import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './sheet.module.css';

export type SheetProps<E extends ElementType = 'section'> = {
    as?: E;
    variant?: 'paper' | 'raised' | 'well';
    border?: 'rule' | 'dashed' | 'ink';
} & Omit<ComponentPropsWithRef<E>, 'as'>;

export function Sheet<E extends ElementType = 'section'>({ as, variant = 'paper', border = 'rule', className, ...props }: SheetProps<E>) {
    return createElement(as ?? 'section', { ...props, className: `${styles.sheet} ${styles[variant]} ${styles[border]}${className ? ` ${className}` : ''}` });
}
