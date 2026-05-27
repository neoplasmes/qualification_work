import type { HTMLAttributes, ReactNode } from 'react';

import styles from './SectionHeader.module.scss';

type SectionHeaderProps = {
    eyebrow?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    headingLevel?: 1 | 2 | 3 | 4;
} & HTMLAttributes<HTMLDivElement>;

export const SectionHeader = ({
    eyebrow,
    title,
    description,
    actions,
    headingLevel = 2,
    className,
    ...props
}: SectionHeaderProps) => {
    const Heading = `h${headingLevel}` as const;

    return (
        <div
            data-stack="v"
            data-gap="sm"
            data-justify="between"
            className={[styles['header'], className ?? ''].filter(Boolean).join(' ')}
            {...props}
        >
            <div className={styles['content']} data-display="grid" data-gap="xs">
                {eyebrow && <span className={styles['eyebrow']}>{eyebrow}</span>}
                {title && <Heading className={styles['title']}>{title}</Heading>}
                {description && <p className={styles['muted']}>{description}</p>}
            </div>
            {actions && (
                <div data-stack="v" data-gap="sm">
                    {actions}
                </div>
            )}
        </div>
    );
};

export const EntityHeader = SectionHeader;
