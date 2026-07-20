import { Divider } from '@qualification-work/design-system';
import { ListFilter, ScrollText, Settings2, type LucideIcon } from 'lucide-react';
import { m } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

import styles from './workspaceRightPanel.widget.module.css';

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

const tabMeta: Record<WorkspaceRightPanelTabKind, WorkspaceRightPanelTabMeta> = {
    history: {
        label: 'Журнал',
        Icon: ScrollText,
    },
    properties: {
        label: 'Свойства',
        Icon: Settings2,
    },
    filters: {
        label: 'Фильтры',
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
        data-gap="sm"
        data-flex
        data-test-id={testId}
    >
        <div
            className={styles['tabs']}
            data-stack="h"
            data-gap="xs"
            role="tablist"
            style={{ '--tabs-count': activeTabs.length } as WorkspaceRightPanelStyle}
        >
            {activeTabs.map(tab => {
                const { Icon, label } = tabMeta[tab];
                const active = activeTab === tab;

                return (
                    <div key={tab} className={styles['tab-wrapper']} data-stack="v">
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

        <Divider />

        <div className={styles['scroll-area']}>{children}</div>
    </aside>
);
