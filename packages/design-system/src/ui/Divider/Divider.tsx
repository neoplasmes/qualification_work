import type { ComponentPropsWithRef } from 'react';
import styles from './divider.module.css';

export type DividerProps = ComponentPropsWithRef<'hr'> & { variant?: 'dashed' | 'solid' };

export function Divider({ variant = 'dashed', className, ...props }: DividerProps) {
    return <hr {...props} className={`${styles.divider} ${styles[variant]}${className ? ` ${className}` : ''}`} />;
}
