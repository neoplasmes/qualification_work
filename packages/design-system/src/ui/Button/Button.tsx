import type { ComponentPropsWithRef } from 'react';
import styles from './button.module.css';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
    variant?: 'primary' | 'ghost' | 'danger';
    size?: 'regular' | 'large';
    fullWidth?: boolean;
};

export function Button({
    variant = 'primary',
    size = 'regular',
    fullWidth,
    className,
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            type={type}
            className={`${styles.button} ${styles[variant]} ${styles[size]}${className ? ` ${className}` : ''}`}
            data-wide={fullWidth || undefined}
        />
    );
}
