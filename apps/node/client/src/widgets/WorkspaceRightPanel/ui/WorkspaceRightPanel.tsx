import { ListFilter, ScrollText, Settings2, type LucideIcon } from 'lucide-react';
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
    <aside className={styles['right-panel']} data-test-id={testId}>
        <div
            className={styles['tabs']}
            role="tablist"
            style={{ '--tabs-count': activeTabs.length } as WorkspaceRightPanelStyle}
        >
            {activeTabs.map(tab => {
                const { Icon, label } = TAB_META[tab];

                return (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        data-test-id={tabTestIds?.[tab]}
                        className={`${styles['tab']} ${
                            activeTab === tab ? styles['active'] : ''
                        }`}
                        onClick={() => onTabChange(tab)}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                );
            })}
        </div>

        {children}
    </aside>
);
