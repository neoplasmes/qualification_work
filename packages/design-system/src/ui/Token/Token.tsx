import type { ComponentPropsWithRef } from 'react';
import styles from './token.module.css';

export type TokenProps = ComponentPropsWithRef<'button'> & {
    variant?: 'value' | 'field' | 'add';
};

export function Token({
    variant = 'value',
    type = 'button',
    className,
    ...props
}: TokenProps) {
    return (
        <button
            {...props}
            type={type}
            className={`${styles.token} ${styles[variant]}${className ? ` ${className}` : ''}`}
        />
    );
}
