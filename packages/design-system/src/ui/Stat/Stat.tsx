import type { ComponentPropsWithRef, ReactNode } from 'react';
import { VStack } from '../VStack';
import { Text } from '../Text';
import styles from './stat.module.css';

export type StatProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
    label: ReactNode;
    value: ReactNode;
    delta?: ReactNode;
    deltaTone?: 'default' | 'danger';
};

export function Stat({
    label,
    value,
    delta,
    deltaTone = 'default',
    className,
    ...props
}: StatProps) {
    return (
        <VStack
            {...props}
            gap={4}
            className={`${styles.stat}${className ? ` ${className}` : ''}`}
        >
            <Text variant="label" tone="mutedCanvas">
                {label}
            </Text>
            <Text variant="heading-lg">{value}</Text>
            {delta !== undefined && delta !== null && typeof delta !== 'boolean' ? (
                <Text variant="data" tone={deltaTone}>
                    {delta}
                </Text>
            ) : null}
        </VStack>
    );
}
