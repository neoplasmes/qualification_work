import type { ReactNode } from 'react';

import styles from './MergeSectionHeader.module.scss';

type MergeSectionHeaderProps = {
    children: ReactNode;
};

export const MergeSectionHeader = ({ children }: MergeSectionHeaderProps) => (
    <div className={styles['section']} data-stack="h" data-gap="sm" data-align="center">
        {children}
    </div>
);
