import type { ComponentPropsWithRef } from 'react';
import { HStack } from '../HStack';
import styles from './notice.module.css';

export type NoticeProps = ComponentPropsWithRef<'div'> & { tone?: 'danger' | 'info' };

export function Notice({ tone = 'danger', className, role = 'status', ...props }: NoticeProps) {
    return <HStack {...props} role={role} gap={24} wrap justify="space-between" className={`${styles.notice} ${styles[tone]}${className ? ` ${className}` : ''}`} />;
}
