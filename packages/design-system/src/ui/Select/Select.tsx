import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { fieldContext } from '../Field';
import styles from './select.module.css';

export type SelectProps = ComponentPropsWithRef<'select'>;

export function Select({ id, className, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }: SelectProps) {
    const field = useContext(fieldContext);

    return <select id={id ?? field.id} {...props} aria-describedby={[field.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined} aria-invalid={field.invalid || ariaInvalid} className={`${styles.control}${className ? ` ${className}` : ''}`} />;
}
