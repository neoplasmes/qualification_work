import { useContext } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { fieldContext } from '../Field';
import styles from './choice.module.css';

export type ChoiceProps = Omit<
    ComponentPropsWithRef<typeof RadioGroup>,
    'children' | 'className'
> & {
    options: readonly { value: string; label: ReactNode; disabled?: boolean }[];
    className?: string;
    size?: 'regular' | 'large';
    fullWidth?: boolean;
};

export function Choice({
    options,
    id,
    className,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    size = 'regular',
    fullWidth,
    ...props
}: ChoiceProps) {
    const field = useContext(fieldContext);

    return (
        <RadioGroup
            {...props}
            id={id ?? field.id}
            aria-labelledby={
                [field.labelId, ariaLabelledBy].filter(Boolean).join(' ') || undefined
            }
            aria-describedby={
                [field.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
                undefined
            }
            aria-invalid={field.invalid || ariaInvalid}
            className={`${styles.group} ${styles[size]}${className ? ` ${className}` : ''}`}
            data-wide={fullWidth || undefined}
        >
            {options.map(option => (
                <BaseRadio.Root
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={styles.option}
                >
                    {option.label}
                </BaseRadio.Root>
            ))}
        </RadioGroup>
    );
}
