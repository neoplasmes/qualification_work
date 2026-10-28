import type { ComponentPropsWithRef } from 'react';
import styles from './marker.module.css';

export type MarkerProps = ComponentPropsWithRef<'mark'>;

export function Marker({ className, ...props }: MarkerProps) {
    return (
        <mark
            {...props}
            className={`${styles.marker}${className ? ` ${className}` : ''}`}
        />
    );
}
