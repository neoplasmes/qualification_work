import type { ComponentPropsWithRef } from 'react';
import styles from './stamp.module.css';

export type StampProps = ComponentPropsWithRef<'span'> & { variant?: 'done' | 'draft' | 'void' };

export function Stamp({ variant = 'done', className, ...props }: StampProps) {
    return <span {...props} className={`${styles.stamp} ${styles[variant]}${className ? ` ${className}` : ''}`} />;
}
