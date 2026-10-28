import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './valueDiff.module.css';

export type ValueDiffProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
    before: ReactNode;
    after: ReactNode;
    changeLabel?: string;
};

export function ValueDiff({
    before,
    after,
    changeLabel = 'becomes',
    className,
    ...props
}: ValueDiffProps) {
    return (
        <span {...props} className={`${styles.diff}${className ? ` ${className}` : ''}`}>
            <del>{before}</del>
            <span role="img" aria-label={changeLabel}>
                →
            </span>
            <ins>{after}</ins>
        </span>
    );
}
