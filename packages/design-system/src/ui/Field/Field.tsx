import { isValidElement, useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { VStack } from '../VStack';
import { Text } from '../Text';
import { fieldContext } from './fieldContext';
import styles from './field.module.css';

export type FieldProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
    label: ReactNode;
    description?: ReactNode;
    error?: ReactNode;
    children: ReactNode;
};

export function Field({ id, label, description, error, children, className, ...props }: FieldProps) {
    const generatedId = useId();
    const control = isValidElement<{ id?: string; inputProps?: { id?: string } }>(children) ? children.props : undefined;
    const controlId = control?.inputProps?.id ?? control?.id ?? id ?? generatedId;
    const describedBy = [description ? `${controlId}-description` : '', error ? `${controlId}-error` : ''].filter(Boolean).join(' ') || undefined;

    return <fieldContext.Provider value={{ id: controlId, labelId: `${controlId}-label`, describedBy, invalid: Boolean(error) }}>
        <VStack {...props} gap={4} className={`${styles.field}${className ? ` ${className}` : ''}`}>
            <label id={`${controlId}-label`} htmlFor={controlId} className={styles.label}>{label}</label>
            {children}
            {description ? <Text id={`${controlId}-description`} variant="body-sm" tone="muted">{description}</Text> : null}
            {error ? <Text id={`${controlId}-error`} variant="body-sm" tone="danger" role="alert">{error}</Text> : null}
        </VStack>
    </fieldContext.Provider>;
}
