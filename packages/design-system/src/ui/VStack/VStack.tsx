import { createElement } from 'react';
import type { ElementType } from 'react';
import type { StackProps } from '../../types';
import styles from './vStack.module.css';

export type VStackProps<E extends ElementType = 'div'> = StackProps<E>;

export function VStack<E extends ElementType = 'div'>({
    as,
    gap,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    fullWidth = false,
    className,
    style,
    ...nativeProps
}: VStackProps<E>) {
    const component = as ?? 'div';
    const classes = `${styles.stack}${fullWidth ? ` ${styles.fullWidth}` : ''}${className ? ` ${className}` : ''}`;
    const stackStyle = gap === undefined ? style : { ...style, gap: `var(--space-${gap})` };

    return createElement(component, {
        ...nativeProps,
        className: classes,
        style: stackStyle,
        'data-align': align,
        'data-justify': justify,
        'data-wrap': wrap || undefined,
    });
}
