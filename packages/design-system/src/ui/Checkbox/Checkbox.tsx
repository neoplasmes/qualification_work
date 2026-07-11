import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { fieldContext } from '../Field';
import styles from './checkbox.module.css';

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'>;

export function Checkbox({ id, className, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }: CheckboxProps) {
    const field = useContext(fieldContext);

    return <input type="checkbox" id={id ?? field.id} {...props} aria-describedby={[field.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined} aria-invalid={field.invalid || ariaInvalid} className={`${styles.control}${className ? ` ${className}` : ''}`} />;
}
