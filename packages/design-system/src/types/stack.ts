import type { ComponentPropsWithRef, ElementType } from 'react';
import type { gaps } from '../theme';

type StackBaseProps<E extends ElementType> = {
    as?: E;
    gap?: (typeof gaps)[number];
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    justify?:
        | 'start'
        | 'center'
        | 'end'
        | 'space-between'
        | 'space-around'
        | 'space-evenly';
    wrap?: boolean;
    fullWidth?: boolean;
};

export type StackProps<E extends ElementType = 'div'> = StackBaseProps<E> &
    Omit<ComponentPropsWithRef<E>, keyof StackBaseProps<E>>;
