import type { HTMLAttributes, ReactNode } from 'react';

import styles from './PanelPlaceholder.module.scss';

type PanelPlaceholderProps = {
    children: ReactNode;
} & HTMLAttributes<HTMLParagraphElement>;

export const PanelPlaceholder = ({
    className,
    children,
    ...props
}: PanelPlaceholderProps) => (
    <p
        data-stack="h"
        data-align="center"
        data-justify="center"
        data-flex
        className={[styles['placeholder'], className ?? ''].filter(Boolean).join(' ')}
        {...props}
    >
        {children}
    </p>
);
