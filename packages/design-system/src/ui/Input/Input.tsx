import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { fieldContext } from '../Field';
import styles from './input.module.css';

export type InputProps = ComponentPropsWithRef<'input'>;

export function Input({ id, className, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }: InputProps) {
    const field = useContext(fieldContext);

    return <input id={id ?? field.id} {...props} aria-describedby={[field.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined} aria-invalid={field.invalid || ariaInvalid} className={`${styles.control}${className ? ` ${className}` : ''}`} />;
}
