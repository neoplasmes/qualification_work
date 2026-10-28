import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { fieldContext } from '../Field';
import styles from './radio.module.css';

export type RadioProps = Omit<ComponentPropsWithRef<'input'>, 'type'>;

export function Radio({
    id,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: RadioProps) {
    const field = useContext(fieldContext);

    return (
        <input
            type="radio"
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
