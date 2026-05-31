import type { ReactNode } from 'react';

import { Separator } from '@/shared/ui';

import styles from './DashboardFormSection.module.scss';

type DashboardFormSectionProps = {
    children: ReactNode;
    action?: ReactNode;
};

export const DashboardFormSection = ({ children, action }: DashboardFormSectionProps) => (
    <div className={styles['section']} data-stack="h" data-gap="sm" data-align="center">
        <Separator className={styles['separator']} />
        <span className={styles['label']}>{children}</span>
        {action ? <span className={styles['action']}>{action}</span> : null}
    </div>
);
