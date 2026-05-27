import type { ReactNode } from 'react';

import { Button, EmptyState, StatusMessage } from '@/shared/ui';

import styles from './WorkspaceLeftPanel.module.scss';

export type WorkspaceLeftPanelAction = {
    label: string;
    icon?: ReactNode;
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

type WorkspaceLeftPanelItemProps = {
    header: ReactNode;
    details?: ReactNode[];
    iconElement?: ReactNode;
    selected?: boolean;
    testId?: string;
    multilineTitle?: boolean;
    onClick: () => void;
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
        data-gap="md"
        data-flex
        data-test-id={testId}
    >
        <div data-stack="h" data-align="center" data-justify="between">
            <h1 className={styles['title']}>{title}</h1>
        </div>

        {action ? (
            <Button
                className={styles['action']}
                data-test-id={action.testId}
                disabled={action.disabled}
                isLoading={action.isLoading}
                title={action.title}
                onClick={action.onClick}
            >
                {action.icon}
                {action.label}
            </Button>
        ) : null}

        {status}

        <section
            className={styles['list']}
            data-display="grid"
            data-gap="sm"
            data-flex
            aria-label={listLabel}
        >
            {loading ? <StatusMessage centered>{loadingText}</StatusMessage> : null}
            {!loading && empty ? <EmptyState>{emptyText}</EmptyState> : null}
            {children}
        </section>

        <div className={styles['total']}>{countLabel}</div>
    </aside>
);

export const WorkspaceLeftPanelItem = ({
    header,
    details = [],
    iconElement,
    selected = false,
    testId,
    multilineTitle = false,
    onClick,
}: WorkspaceLeftPanelItemProps) => (
    <button
        type="button"
        data-test-id={testId}
        className={`${styles['item']} ${selected ? styles['selected'] : ''}`}
        onClick={onClick}
    >
        <div className={styles['item-body']}>
            <div
                className={`${styles['item-header']} ${
                    multilineTitle ? styles['multiline'] : ''
                }`}
            >
                {header}
            </div>
            {details.length > 0 ? (
                <div className={styles['item-details']}>
                    {details.map((value, index) => (
                        <span key={index}>{value}</span>
                    ))}
                </div>
            ) : null}
        </div>
        {iconElement ? <div className={styles['item-icon']}>{iconElement}</div> : null}
    </button>
);
