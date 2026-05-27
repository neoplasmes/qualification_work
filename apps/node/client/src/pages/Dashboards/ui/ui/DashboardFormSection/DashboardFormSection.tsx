import type { ReactNode } from 'react';

import { Separator } from '@/shared/ui';

import styles from './DashboardFormSection.module.scss';

type DashboardFormSectionProps = {
    children: ReactNode;
};

export const DashboardFormSection = ({ children }: DashboardFormSectionProps) => (
    <div className={styles['section']} data-stack="h" data-gap="sm" data-align="center">
        <Separator className={styles['separator']} />
        <span>{children}</span>
    </div>
);
