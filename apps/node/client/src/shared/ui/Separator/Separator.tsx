import type { HTMLAttributes } from 'react';

import styles from './Separator.module.scss';

type SeparatorProps = {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
} & Omit<HTMLAttributes<HTMLHRElement>, 'children'>;

export const Separator = ({
    orientation = 'horizontal',
    decorative = true,
    className,
    ...props
}: SeparatorProps) => (
    <hr
        className={[styles['separator'], className ?? ''].filter(Boolean).join(' ')}
        data-orientation={orientation}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        {...props}
    />
);
