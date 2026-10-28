import { useContext } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { fieldContext } from '../Field';
import styles from './numberField.module.css';

export type NumberFieldProps = Omit<
    ComponentPropsWithRef<typeof BaseNumberField.Root>,
    'className'
> & {
    className?: string;
    size?: 'regular' | 'large';
    decrementLabel?: string;
    incrementLabel?: string;
    inputProps?: Omit<
        ComponentPropsWithRef<typeof BaseNumberField.Input>,
        'className'
    > & {
        className?: string;
    };
};

export function NumberField({
    id,
    className,
    size = 'regular',
    decrementLabel = 'Decrease',
    incrementLabel = 'Increase',
    inputProps,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: NumberFieldProps) {
    const field = useContext(fieldContext);

    return (
        <BaseNumberField.Root
            {...props}
            id={inputProps?.id ?? id ?? field.id}
            className={`${styles.root} ${styles[size]}${className ? ` ${className}` : ''}`}
        >
            <BaseNumberField.Group className={styles.group}>
                <BaseNumberField.Decrement
                    aria-label={decrementLabel}
                    className={styles.button}
                >
                    −
                </BaseNumberField.Decrement>
                <BaseNumberField.Input
                    {...inputProps}
                    id={inputProps?.id ?? id ?? field.id}
                    aria-label={inputProps?.['aria-label'] ?? ariaLabel}
                    aria-labelledby={inputProps?.['aria-labelledby'] ?? ariaLabelledBy}
                    aria-describedby={
                        [
                            field.describedBy,
                            ariaDescribedBy,
                            inputProps?.['aria-describedby'],
                        ]
                            .filter(Boolean)
                            .join(' ') || undefined
                    }
                    aria-invalid={
                        field.invalid || inputProps?.['aria-invalid'] || ariaInvalid
                    }
                    className={`${styles.input}${inputProps?.className ? ` ${inputProps.className}` : ''}`}
                />
                <BaseNumberField.Increment
                    aria-label={incrementLabel}
                    className={styles.button}
                >
                    +
                </BaseNumberField.Increment>
            </BaseNumberField.Group>
        </BaseNumberField.Root>
    );
}
