import { createElement } from 'react';
import type { ElementType } from 'react';
import type { StackProps } from '../../types';
import styles from './hStack.module.css';

export type HStackProps<E extends ElementType = 'div'> = StackProps<E>;

export function HStack<E extends ElementType = 'div'>({
    as,
    gap,
    align = 'center',
    justify = 'start',
    wrap = false,
    fullWidth = false,
    className,
    style,
    ...nativeProps
}: HStackProps<E>) {
    const component = as ?? 'div';
    const classes = `${styles.stack}${fullWidth ? ` ${styles.fullWidth}` : ''}${className ? ` ${className}` : ''}`;
    const stackStyle =
        gap === undefined ? style : { ...style, gap: `var(--space-${gap})` };

    return createElement(component, {
        ...nativeProps,
        className: classes,
        style: stackStyle,
        'data-align': align,
        'data-justify': justify,
        'data-wrap': wrap || undefined,
    });
}
