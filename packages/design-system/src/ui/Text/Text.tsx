import { createElement } from 'react';
import type { ComponentPropsWithRef, ElementType } from 'react';
import type { textVariants } from '../../theme';
import styles from './text.module.css';

type TextBaseProps<E extends ElementType> = {
    as?: E;
    variant?: (typeof textVariants)[number];
    tone?: 'default' | 'muted' | 'mutedCanvas' | 'danger' | 'inverse' | 'accent';
    align?: 'start' | 'center' | 'end';
    tabular?: boolean;
};

export type TextProps<E extends ElementType = 'span'> = TextBaseProps<E>
    & Omit<ComponentPropsWithRef<E>, keyof TextBaseProps<E>>;

export function Text<E extends ElementType = 'span'>({
    as,
    variant = 'body',
    tone = 'default',
    align = 'start',
    tabular = false,
    className,
    ...nativeProps
}: TextProps<E>) {
    const component = as ?? 'span';
    const classes = `${styles.text} ${styles[tone]}${className ? ` ${className}` : ''}`;

    return createElement(component, {
        ...nativeProps,
        className: classes,
        'data-variant': variant,
        'data-align': align,
        'data-tabular': tabular || undefined,
    });
}
