import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { fieldContext } from '../Field';
import styles from './textarea.module.css';

export type TextareaProps = ComponentPropsWithRef<'textarea'>;

export function Textarea({
    id,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: TextareaProps) {
    const field = useContext(fieldContext);

    return (
        <textarea
            id={id ?? field.id}
            {...props}
            aria-describedby={
                [field.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
                undefined
            }
            aria-invalid={field.invalid || ariaInvalid}
            className={`${styles.control}${className ? ` ${className}` : ''}`}
        />
    );
}
