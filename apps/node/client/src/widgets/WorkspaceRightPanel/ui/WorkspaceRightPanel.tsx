import { ListFilter, ScrollText, Settings2, type LucideIcon } from 'lucide-react';
import { m } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

import styles from './WorkspaceRightPanel.module.scss';

export type WorkspaceRightPanelTabKind = 'history' | 'properties' | 'filters';

type WorkspaceRightPanelTabMeta = {
    label: string;
    Icon: LucideIcon;
};

type WorkspaceRightPanelStyle = CSSProperties & {
    '--tabs-count': number;
};

type WorkspaceRightPanelProps<T extends WorkspaceRightPanelTabKind> = {
    activeTab: T;
    activeTabs: readonly T[];
    children: ReactNode;
    testId?: string;
    tabTestIds?: Partial<Record<T, string>>;
    onTabChange: (tab: T) => void;
};

const TAB_META: Record<WorkspaceRightPanelTabKind, WorkspaceRightPanelTabMeta> = {
    history: {
        label: 'History',
        Icon: ScrollText,
    },
    properties: {
        label: 'Properties',
        Icon: Settings2,
    },
    filters: {
        label: 'Filters',
        Icon: ListFilter,
    },
};

export const WorkspaceRightPanel = <T extends WorkspaceRightPanelTabKind>({
    activeTab,
    activeTabs,
    children,
    testId,
    tabTestIds,
    onTabChange,
}: WorkspaceRightPanelProps<T>) => (
    <aside
        className={styles['right-panel']}
        data-stack="v"
        data-gap="md"
        data-flex
        data-test-id={testId}
    >
        <div
            className={styles['tabs']}
            data-display="grid"
            data-gap="xs"
            role="tablist"
            style={{ '--tabs-count': activeTabs.length } as WorkspaceRightPanelStyle}
        >
            {activeTabs.map(tab => {
                const { Icon, label } = TAB_META[tab];
                const active = activeTab === tab;

                return (
                    <div key={tab} className={styles['tab-wrapper']} data-display="grid">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={active}
                            data-test-id={tabTestIds?.[tab]}
                            className={`${styles['tab']} ${
                                active ? styles['active'] : ''
                            }`}
                            onClick={() => onTabChange(tab)}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                        <div className={styles['active-tab-slot']}>
                            {active ? (
                                <m.div
                                    className={styles['active-tab']}
                                    layoutId="workspace-right-panel-active-tab"
                                    transition={{ duration: 0.3 }}
                                />
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>

        {children}
    </aside>
);
