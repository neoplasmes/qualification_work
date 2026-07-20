import { Divider, IconButton, Text } from '@qualification-work/design-system';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState, StatusMessage } from '@/shared/ui';

import styles from './workspaceLeftPanel.widget.module.css';

export type WorkspaceLeftPanelAction = {
    label: string;
    Icon: LucideIcon;
    testId?: string;
    disabled?: boolean;
    isLoading?: boolean;
    title?: string;
    onClick: () => void;
};

type WorkspaceLeftPanelProps = {
    title: string;
    countLabel: string;
    testId: string;
    listLabel: string;
    action?: WorkspaceLeftPanelAction;
    loading?: boolean;
    loadingText: string;
    empty?: boolean;
    emptyText: string;
    status?: ReactNode;
    children: ReactNode;
};

export const WorkspaceLeftPanel = ({
    title,
    countLabel,
    testId,
    listLabel,
    action,
    loading = false,
    loadingText,
    empty = false,
    emptyText,
    status,
    children,
}: WorkspaceLeftPanelProps) => (
    <aside
        className={styles['panel']}
        data-stack="v"
        data-gap="sm"
        data-flex
        data-test-id={testId}
    >
        <div
            className={styles['top-line-block']}
            data-stack="h"
            data-align="center"
            data-justify="between"
            data-px="md"
        >
            <Text as="h1" variant="heading">
                {title}
            </Text>
            {action ? (
                <IconButton
                    variant="ghost"
                    data-p="none"
                    data-test-id={action.testId}
                    disabled={action.disabled || action.isLoading}
                    aria-busy={action.isLoading}
                    title={action.title ?? action.label}
                    aria-label={action.label}
                    onClick={action.onClick}
                >
                    <action.Icon size={20} strokeWidth={2.4} />
                </IconButton>
            ) : null}
        </div>
        <Divider />
        {status}

        <section
            className={styles['list']}
            data-stack="v"
            data-gap="xs"
            data-flex
            aria-label={listLabel}
        >
            {loading ? <StatusMessage centered>{loadingText}</StatusMessage> : null}
            {!loading && empty ? <EmptyState>{emptyText}</EmptyState> : null}
            {children}
        </section>

        <div className={styles['total']} data-pt="xs">
            {countLabel}
        </div>
    </aside>
);
